---
title: java_interface
date: 2024-04-10 19:56:51
tags:
---

# JAVA速成Day3——接口

java提倡OOP(面向对象编程)，然后有个东西叫做抽象类，需要子类继承来重写其定义的方法。

然后接口这个东西更抽象，相比抽象类，它只有方法，没有字段：

```java
interface bird{
    void fly();
    String getName();
}
```

当具体的类要实现这些接口时，需要使用 `implements` 关键字：

```java
class blackbird implements bird{
    private String name;

    public blackbird(String name){
        this.name = name;
    }

    @Override
    public void fly() {
        System.out.println(name + " is flying~");
    }

    @Override
    public String getName() {
        return name;
    }
}
```

然而，java不能同时继承多个类，但是可以同时实现多个接口。

接口之间可以继承：

```java
interface Hello {
    void hello();
}

interface bird extends Hello {
    void fly();
    String getName();
}
```

神奇的是，可以通过接口去引用对象：

```java
public class test {
    public static void main(String[] args) {
        bird bb = new blackbird("taffy");
        bb.fly();
    }
}
```

然而，对于对象自己实现的方法，接口没办法引用。

实际上，在我整的JAVA速成Day1那篇介绍集合的文章中，我留了个坑：用Map引用TreeMap。

实际上这里的Map，以及List，都是接口。

它们引用的对象，只能调用自己即继承的接口内部的方法。

因此对于TreeMap中独属于该类的方法，接口Map不能调用。因此你会发现IDEA的自动补全里少了点API。



另外，接口中可以定义 `default` 方法，然后直接在接口内部实现：

```java
interface bird{
    void fly();
    String getName();

    default void hello(){
        System.out.println(getName() + " will succeed!");
    }
}

class blackbird implements bird{
    private String name;

    public blackbird(String name){
        this.name = name;
    }

    @Override
    public void fly() {
        System.out.println(name + " is flying~");
    }

    @Override
    public String getName() {
        return name;
    }

    public void hh(){

    }
}

public class test {
    public static void main(String[] args) {
        bird bb = new blackbird("blackbird");
        bb.hello();
    }
}

```

这样的话，如果对于一个接口新增一个方法，就不需要更改所有实现它的子类了，只需要在需要的地方 `override` 即可。

------

晚安

------

事实上接口是可以有字段的，但是其类型为 `public static final` ：

```java
public interface Person {
    public static final int MALE = 1;
    public static final int FEMALE = 2;
}
```

--update 24.4.11
