---
title: GAS_Intro
date: 2025-09-17 18:04:00
tags: 'Unreal Engine'
---

# Gameplay Ability System前置知识

再进入我们UE5特供的GAS插件之前，我们需要回顾一些关于虚幻的知识~

## Controller

在我之前使用UE4制作一些demo的时候，我通常直接在要控制的Character类中，实现一些逻辑（如控制输入）。然而，受MVC设计模式的启发，对于我们要possess的Character（或者Pawn），应当尽量将逻辑与功能解耦合。

我自己举一个例子吧，例如在射击游戏中，可能存在固定位置的机枪、岸防炮，我们应当将这些作为Pawn的子类，因为它们需要被玩家控制。对于各自武器的特定功能，例如发射子弹或者炮弹，应当在Pawn中实现，因为它们是独立于Controller的。对于Controller，我们可以切换自己possess的pawn，例如在使用固定机枪前控制我们的角色，这时候可以进行移动，而使用机枪时，则可以控制机枪射击，无法进行移动。而这便是Controller的职责。（对于切换移动，我目测可以采用UE5的Enhanced Input系统，通过切换Input Mapping Context来实现。

当然，对于Controller，它本身也内置了一些控制逻辑，例如我在制作射击游戏demo的时候，在角色死亡后，需要调用PlayerController内置的禁用输入，来防止诈尸。还有一个特定的Controller叫做AIController，它通过绑定行为树（Behavior Tree）和黑板（Blackboard）来负责控制AI的行为。例如在游戏中，AI需要根据玩家的位置，来判断是否需要进行移动，或者进行攻击。

> 对于Controller的深入思考，推荐https://zhuanlan.zhihu.com/p/23480071

我们在PlayerController的类中，添加增强输入系统所需要的IMC(Input Mapping Context)和IA(Input Action)：
```cpp
UPROPERTY(EditAnywhere, Category = Input)
TObjectPtr<UInputMappingContext> AuraContext;

UPROPERTY(EditAnywhere, Category = "Input | Actions")
TObjectPtr<UInputAction> MoveAction;
```

然后在 `BeginPlay` 中，通过 `UEnhancedInputLocalPlayerSubsystem` 来添加IMC：
```cpp
UEnhancedInputLocalPlayerSubsystem* Subsystem = ULocalPlayer::GetSubsystem<UEnhancedInputLocalPlayerSubsystem>(GetLocalPlayer());
check(Subsystem); // assert
Subsystem->AddMappingContext(AuraContext, 0); // 0是优先级，这里我们先只添加一个IMC。对于Top Down RPG，目前我们没遇到比较复杂的输入情况。
```

对于PlayerController，我们可以override `SetupInputComponent` 来添加输入逻辑：
```cpp
void AAuraPlayerController::SetupInputComponent()
{
	Super::SetupInputComponent();

	UEnhancedInputComponent* EnhancedInputComponent = CastChecked<UEnhancedInputComponent>(InputComponent);

	EnhancedInputComponent->BindAction(
		MoveAction,
		ETriggerEvent::Triggered,
		this,
		&AAuraPlayerController::Move // 需要自行实现Move逻辑（参数类型为const FInputActionValue&，这里不予赘述）
	);
}
```

另外再提一句，在 `ACharacter` 类中，内置了 `SetupPlayerInputComponent` 的函数。我之前一直重写这个函数，来绑定输入：
```cpp
void ACharacter::SetupPlayerInputComponent(UInputComponent* PlayerInputComponent)
{
	check(PlayerInputComponent);
}
```

再进一步，我们会惊讶地发现，`InputComponent` 是 `AActor` 就有的成员变量！
```cpp
// Actor.h
/** Component that handles input for this actor, if input is enabled. */
	UPROPERTY(DuplicateTransient)
	TObjectPtr<class UInputComponent> InputComponent;
```

也就是说，对于普通的Actor，我们也可以通过 `InputComponent` 来绑定输入。然而就和前面提到的，虚幻采用了类似MVC的设计模式，将逻辑与功能解耦合。对于输入，可以想一下，如果我们需要控制不同的Character，但是一些基本的移动逻辑，它们是共有的，我们应当在Controller中实现，而不是在Character中实现。

## 接口

接口是C++中的一种抽象类型，它定义了类必须实现的一组函数。接口可以被类继承，从而实现多态。

在C++中，接口通常通过纯虚函数（pure virtual function）来实现。纯虚函数是一种没有实现的虚函数，它必须在派生类中实现。

在UE也是一样。我们在本课程要实现的一个功能，就是当鼠标移动到敌人身上时，显示敌人的轮廓。我们首先想到的是在敌人的基类中实现相关功能。但是如果我们不只是需要显示敌人的轮廓，可能我们需要显示其它物品的轮廓，那么在敌人的基类中实现显示轮廓的功能，是不是就不恰当了呢？

```cpp
// EnemyInterface.h
class GAS_API IEnemyInterface
{
	GENERATED_BODY()

	// Add interface functions to this class. This is the class that will be inherited to implement this interface.
public:
	virtual void HighlightActor() = 0;
	virtual void UnHighlightActor() = 0;
};
```

然后我们就可以在Enemy类中，继承（实现）这个接口：
```cpp
UCLASS()
class GAS_API AAuraEnemy : public AAuraCharacterBase, public IEnemyInterface
{
	GENERATED_BODY()
public:
	virtual void HighlightActor() override;
	virtual void UnHighlightActor() override;
};
```

## Delegate（委托）

在软件工程中，我们经常会需要一种类与类之间的单向依赖，即类A中有类B的对象的指针，而类B则完全不知道类A。

例如在实现UI逻辑时，为了遵循MVC设计模式，我们通常要自己实现一个Controller类用于从Model提取数据并更新View。然而为了代码的可维护性，我们希望View能够知道其对应的Controller，而Controller则完全不知道View，但是Controller知道数据的变化后能够及时更新View。

如何实现这种单向依赖呢？在UE中可以通过Delegate实现。可以在Controller类中储存一些Delegate类，然后在View中通过其Controller指针获取Delegate，通过该Delegate来注册自己的函数指针以及对象信息，最后在Controller要广播的时候通过获取自己Delegate的函数指针和对象信息来进行一系列的函数调用。

为了更直观地感受，我自己实现了一个简单的MultiDelegate，它支持一个Delegate能够广播到多个地方。

首先实现一个基类Object，用于后续类的继承：
```cpp
// Object.h
#pragma once

class Object
{
public:
    Object() = default;
    virtual ~Object() = default;
};
```

然后实现我们的Delegate类，这里为了简便，规定函数是 `void()` 这种最简单的类型：
```cpp
#pragma once

// void*()

#include<vector>
#include<utility>

class Object;

class MultiDelegate
{
    using FuncType = void(Object::*)();
public:
    MultiDelegate() = default;
    virtual ~MultiDelegate() = default;
    void AddObject(Object* obj, FuncType func)
    {
        m_funcs.push_back(std::make_pair(obj, func));
    }
    void Broadcast() const
    {
        for (const auto& [obj, func] : m_funcs)
        {
            if(obj && func)
                (obj->*func)();
        }
    }
private:
    std::vector<std::pair<Object *, FuncType>> m_funcs;
};
```

可以看到其内部就是用 `std::vector` 储存了 `Object *` 和 `FuncType` 的元组。最后我们给出测试程序：
```cpp
// test.cpp
#include "Delegate.h"
#include "Object.h"
#include <iostream>

class Three
{
public:
    MultiDelegate OnNotify;
    void Notify() const
    {
        OnNotify.Broadcast();
    }
};

class One : public Object
{
public:
    One() = default;
    explicit One(size_t i) : id(i) {}
    void Notify()
    {
        std::cout << "One::Notify " << id << "!" << std::endl;
    }
    void ThreeGet()
    {
        if(m_three)
            m_three->OnNotify.AddObject(this, static_cast<void(Object::*)()>(&One::Notify));
    }
    void SetThree(Three* three) { m_three = three; ThreeGet(); }
    Three* GetThree() const { return m_three; }
private:
    Three* m_three = nullptr;
    size_t id{};
};

class Two : public Object
{
public:
    void Notify()
    {
        std::cout << "Two::Notify" << std::endl;
    }
    void ThreeGet()
    {
        if(m_three)
            m_three->OnNotify.AddObject(this, static_cast<void(Object::*)()>(&Two::Notify));
    }
    void SetThree(Three* three) { m_three = three; ThreeGet(); }
    Three* GetThree() const { return m_three; }
private:
    Three* m_three = nullptr;
};

int main()
{
    Three three;
    One one(1); one.SetThree(&three); 
    One one2(2); one2.SetThree(nullptr);
    Two two; two.SetThree(&three);
    three.Notify();
    return 0;
}
```

这里类 `One` 和 `Two` 都继承 `Object` （类似UE中的 `UObject`），然后它们都有类 `Three` 的指针，而 `Three` 则不知道任何关于 `One` 和 `Two` 的信息。

> 这么说有点不严谨，毕竟这里必须要求 `Three` （或者 `MultiDelegate`） 知道 `One` 和 `Two` 继承 `Object`。

构建类 `One` 和 `Two` 的副本，并设置其对应的 `Three`，并在设置完 `Three` 后绑定自己的 `Notify` 函数。最后 `Three` 进行广播：
```
One::Notify 1!
Two::Notify
```

然而在UE中还有Dynamic_Delegate（动态委托），其使用了 `UObject` 的反射系统，让我们能够将蓝图实现的函数绑定到该委托上，关于反射系统，这是进阶内容，先挖个坑吧。