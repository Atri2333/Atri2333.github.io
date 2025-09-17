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
> 挖坑.jpg