---
layout: asc
title: ASC and AS
date: 2025-09-18 23:07:25
tags:
---

> 目前GAS系列文章是在作者边学边实践的过程中的产出，因此未来100%会继续改善。

# GAS-1

在这篇文章，我们来引进GAS系统中的两个部件。

## Ability System Component

Ability System Component(ASC)是整个GAS系统中最基础的一个组件，它负责主要的对象与GAS的交互。在后续提及Gameplay Effect(GE)的时候，可以发现GE本身就是通过ASC进行施加的，同时这个过程中需要的 `FGameplayEffectContextHandle` 和 `FGameplayEffectSpecHandle` 都是通过ASC进行构建。不仅如此，ASC还和其所在类对应的AttributeSet，以及处理各种Gameplay Effect与使用技能Gameplay Ability都密切相关。因此对于一个角色，如果要将其加入GAS系统，你第一时间就是给予其一个Ability System Component。

ASC有两个代表Actor，分别是OwnerActor和AvatarActor，前者是实际构建（拥有）该ASC的Actor，而后者是该ASC所作用的Actor。显然二者并不一样，对于玩家所操控的角色，一般会将OwnerActor设置为PlayerState，而将AvatarActor设置为Character。这两个Actor都需要一个指向同一个ASC的指针，依照Epic的惯例，需要实现接口 `IAbilitySystemInterface` 中的 `GetAbilitySystemComponent()` 函数。

在PlayerState的构造函数中，我们来实际构造ASC：
```cpp
// 构造ASC
AbilitySystemComponent = CreateDefaultSubobject<UAuraAbilitySystemComponent>("Ability System Component");
AbilitySystemComponent->SetIsReplicated(true);
// Rule of thumb
// Tip: 若设置成Mixed，那么ASC的Owner Actor的Owner必须是Controller, 这或许和Mixed方式在Replicate需要判断Client的身份有关
AbilitySystemComponent->SetReplicationMode(EGameplayEffectReplicationMode::Mixed);

```

对于多人游戏，一定要将ASC设置为Replicated。在GAS中还可以指定Replicate的模式，有三种模式：
```cpp
/** How gameplay effects will be replicated to clients */
UENUM()
enum class EGameplayEffectReplicationMode : uint8
{
	/** Only replicate minimal gameplay effect info. Note: this does not work for Owned AbilitySystemComponents (Use Mixed instead). */
	Minimal,
	/** Only replicate minimal gameplay effect info to simulated proxies but full info to owners and autonomous proxies */
	Mixed,
	/** Replicate full gameplay info to all */
	Full,
};
```

在上面的代码中我们设置为Mixed，这是多人游戏中对于玩家角色中最经常采用的折中方案，本地玩家能得到GE的完整信息，而本地客户端中其余玩家操控的角色对应的代理客户端则同步最小的Info。

如果我们要创建一个敌人的类，它也要接入GAS系统，则可以直接在其Pawn类中构建ASC，同时将ReplicationMode设置为Minimal。

> 注意：Mixed模式需要保证它的Owner Actor的Owner必须是Controller, 这或许和Mixed方式在Replicate中需要判断Client的身份有关。

### InitAbilityActorInfo

`InitAbilityActorInfo` 函数设置一个ASC的OwnerActor和AvatarActor，该函数需要在服务器和客户端分别独自调用。需要注意的是，对于多人游戏，需要保证每个客户端本地的PlayerController被Replicate结束后才可调用`InitAbilityActorInfo`。因此有个Rule of Thumb，它需要保证调用该函数之前已经完成了PlayerController控制了Character的工作，以不扰乱对于Gameplay架构中基类的初始化工作。

```
原观点：InitAbilityActorInfo calls FGameplayAbilityActorInfo::InitFromActor() which for players caches their PlayerController. For multiplayer games this step must succeed in order to activate local predicted abilities. Keep in mind that the PlayerController may not be replicated over yet when an ASC begins play client-side, because there is no guarantee for in which order actors are spawned client-side.

出处：[link](https://dev.epicgames.com/community/learning/tutorials/DPpd/unreal-engine-gameplay-ability-system-best-practices-for-setup#whenshouldicallinitabilityactorinfo/refreshabilityactorinfoforaplayer?)
```

因此在客户端我们可以重写Character或者Controller中的 `OnRep_PlayerState` 方法，在里面执行`InitAbilityActorInfo`。当然对于客户端，直接在Character的 `PossessedBy`或者Controller的 `OnPossess` 中调用。
```cpp
// server-called only
void AAuraCharacter::PossessedBy(AController* NewController)
{
	Super::PossessedBy(NewController);

	// 在服务器需要在角色被Controller控制后方可设置Ability Actor Info
	InitAbilityActorInfo();
}

// client-called only
void AAuraCharacter::OnRep_PlayerState()
{
	Super::OnRep_PlayerState();

	// 在客户端需要同时保证Controller和PlayerState都是有效的才能设置Ability Actor Info
	InitAbilityActorInfo();
}


void AAuraCharacter::InitAbilityActorInfo()
{
	AAuraPlayerState* AuraPlayerState = CastChecked<AAuraPlayerState>(GetPlayerState());
	AuraPlayerState->GetAbilitySystemComponent()->InitAbilityActorInfo(AuraPlayerState, this);
	AbilitySystemComponent = AuraPlayerState->GetAbilitySystemComponent();
	AttributeSet = AuraPlayerState->GetAttributeSet();
}
```

