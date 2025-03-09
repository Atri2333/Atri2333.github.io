---
title: JAVA速成Day2——单例模式
date: 2024-04-09 20:35:30
tags: 
mathjax: true
---

# JAVA速成Day2——单例模式

南软，我的南软

## 单例模式

确保一个类只有一个实例，并提供该实例的全局访问点。

1. **线程不安全的懒汉式**

懒汉代表**延迟实例化**，即只在需要的时候实例化一个对象。

```java
public class Singleton {
    private static Singleton uniqueInstance;

    private Singleton(){
        // 这里使用 private 保证只在类的内部实例化对象
    }

    public static Singleton getUniqueInstance(){ // 必须要是 static 
        if(uniqueInstance == null){
            // 这里是线程不安全的
            uniqueInstance = new Singleton();
        }
        return uniqueInstance;
    }
}
```

2. **线程安全的饿汉式**

直接在声明对象的时候创建一个全局静态对象。

```java
public class Singleton {
    private static Singleton uniqueInstance = new Singleton();

    private Singleton(){
        // 这里使用 private 保证只在类的内部实例化对象
    }

    public static Singleton getUniqueInstance(){
        return uniqueInstance;
    }
}
```

这个方式丢失了节约资源的好处。

3. **线程安全的懒汉式**

在第一种方式的race condition那里上锁即可。方法是加上 `synchronized` 关键字。

```java
public class Singleton {
    private static Singleton uniqueInstance;

    private Singleton(){
        // 这里使用 private 保证只在类的内部实例化对象
        System.out.println("love u");
    }

    public static synchronized Singleton getUniqueInstance(){ // 必须要是 static
        if(uniqueInstance == null){
            // 这里是线程安全的
            uniqueInstance = new Singleton();
        }
        return uniqueInstance;
    }
}
```

但是这里序列化了 `getUniqueInstance` 方法，失去了多线程并发的意义。

4. **双重校验锁**

```java
public class Singleton {
    private volatile static Singleton uniqueInstance;

    private Singleton(){
        // 这里使用 private 保证只在类的内部实例化对象
        System.out.println("love u");
    }

    public static Singleton getUniqueInstance(){ // 必须要是 static
        if(uniqueInstance == null){
            synchronized (Singleton.class) {
                if(uniqueInstance == null){
                    uniqueInstance = new Singleton();
                }
            }
        }
        return uniqueInstance;
    }
}
```

这里必须使用双重 `if` ，原因相信你能直接看出来。

至于 `volatile` 关键字，也是必不可少的。这是因为语句 `uniqueInstance = new Singleton();` 并不是原子的，它需要进行：

1. 分配内存空间
2. 初始化对象
3. 将 `uniqueInstance` 指向对应的内存地址。

但是 jvm 可能会将指令重排，将上述执行顺序更改为1>3>2，这在多线程的情况下是有问题的，可能在另一个线程得到未初始化的对象。

5. **静态内部类**

静态内部类。。。这个打codeforces倒是经常用。

```java
public class Singleton {
    private static Singleton uniqueInstance;
    private Singleton(){
        System.out.println("love u, blackbird");
    }

    private static class SingletonHolder{
        private static final Singleton INSTANCE = new Singleton();
    }

    public static Singleton getUniqueInstance(){ // 必须要是 static
        return SingletonHolder.INSTANCE;
    }
}
```

原理有两点：

- 静态内部类在 `Singleton` 外部类加载的时候并没有被加载进内存，只有需要的时候（调用 `get` 方法）才会加载；
- 虚拟机提供了线程安全，不会多次加载静态内部类。

很神奇是吧？我也觉得~

6. **枚举实现**

这东西我第一次看的时候懵了。代码长这样：

```java
public enum Singleton {
    INSTANCE;
}  
```

挖个坑吧，不是很懂。

------



## 枚举

讲真之前我连C语言的enum是干啥的我都不知道。。。

在java中，可以通过 `static final` 来定义常量：

```java
public class Weekday {
    public static final int SUN = 0;
    public static final int MON = 1;
    public static final int TUE = 2;
    public static final int WED = 3;
    public static final int THU = 4;
    public static final int FRI = 5;
    public static final int SAT = 6;
}
```

可以通过 `Weekday.SUN` 等形式来访问这些常量。

当然也可以不用int来定义常量，比如String这种。但是在比较的时候需要把 `==` 改成 `equals()`。

当我们的需求不依赖于这种int或者String的类型变量时，可以通过 `enum` 定义枚举类：

```java
enum Weekday {
    SUN, MON, TUE, WED, THU, FRI, SAT;
}

int day = 1;
if (day == Weekday.SUN) { // Compile error: bad operand types for binary operator '=='
}

Weekday x = Weekday.SUN; // ok!
Weekday y = Color.RED; // Compile error: incompatible types
```

enum定义的枚举类是一种引用类型，但是可以用 `==` 来比较。这是因为enum类型的每个常量在jvm中都只有一个实例，你无法new一个enum对象。

```java
if (day == Weekday.FRI) { // ok!
}
if (day.equals(Weekday.SUN)) { // ok, but more code!
}
```

（或许这也是可以使用enum实现单例模式的原因

enum编译后的结果maybe like：

```java
public final class Color extends Enum { // 继承自Enum，标记为final class
    // 每个实例均为全局唯一:
    public static final Color RED = new Color();
    public static final Color GREEN = new Color();
    public static final Color BLUE = new Color();
    // private构造方法，确保外部无法调用new操作符:
    private Color() {}
}
```

可以发现，每个枚举对象都对应一个唯一的静态实例。同时构造方法是 `private` 的，不让你new。

但是，其实可以自定义字段与构造方法：

```java
public class Main {
    public static void main(String[] args) {
        Weekday day = Weekday.SUN;
        if (day.dayValue == 6 || day.dayValue == 0) {
            System.out.println("Work at home!");
        } else {
            System.out.println("Work at office!");
        }
    }
}

enum Weekday {
    MON(1), TUE(2), WED(3), THU(4), FRI(5), SAT(6), SUN(0);

    public final int dayValue; // final!!!

    private Weekday(int dayValue) {
        this.dayValue = dayValue;
    }
}
```

可以重写 `toString()` 方法，这样调试输出比较方便：

```java
public class Main {
    public static void main(String[] args) {
        Weekday day = Weekday.SUN;
        if (day.dayValue == 6 || day.dayValue == 0) {
            System.out.println("Today is " + day + ". Work at home!"); // 自动调用day.toString()
        } else {
            System.out.println("Today is " + day + ". Work at office!");
        }
    }
}

enum Weekday {
    MON(1, "星期一"), TUE(2, "星期二"), WED(3, "星期三"), THU(4, "星期四"), FRI(5, "星期五"), SAT(6, "星期六"), SUN(0, "星期日");

    public final int dayValue;
    private final String chinese;

    private Weekday(int dayValue, String chinese) {
        this.dayValue = dayValue;
        this.chinese = chinese;
    }

    @Override
    public String toString() {
        return this.chinese;
    }
}
```

------

回过来看单例模式

由于enum类部的对象在整个生命周期只会出现一次，而且无论是哪个enum类引用到的对象是同一个，因此可以据此实现单例模式。

```java
public enum Singleton {
    INSTANCE();
    private String bird;
    private int hh;
    Singleton(){}

    public void setBird(String bird) {
        this.bird = bird;
    }

    public void setHh(int hh) {
        this.hh = hh;
    }

    public int getHh() {
        return hh;
    }

    public String getBird() {
        return bird;
    }


    public static void main(String[] args) {
        Singleton singleton = Singleton.INSTANCE;
        singleton.setBird("blackbird");
        singleton.setHh(2333);
        System.out.println(singleton.getBird() + " " + singleton.getHh());
        Singleton singleton1 = Singleton.INSTANCE;
        System.out.println(singleton1.getBird() + " " + singleton1.getHh());
    }
}
// blackbird 2333
// blackbird 2333
```

很神奇是吧hh

