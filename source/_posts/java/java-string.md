---
title: java_string
date: 2024-04-11 20:57:27
tags:
---

# JAVA速成Day4——字符串

字符串也是ACM里常用的东西，但是java里的字符串我并不是很熟悉，所以这次就稍微速通一下~

## String：

首先我们得清楚String类在java中是**不可变的**。这真的勾八坑爹

- equals()

比较两个String是否相等，返回boolean

- compareTo()

比较两个字符串的字典序，返回负数/0/正数

- substring()

提取子串，左闭右开。第二个参数可选

```java
"blackbird".substring(5) // bird
```

- toCharArray()

转化为 `Char[]` 。

## StringBuilder

由于String类部是 `final` 类型，不可变。因此当你使用 `+` 连接两个String时，事实上会再new一个String对象，这是没有效率的。

所以java提供了一个类StringBuilder，它是可变的。

```java
public class Main {
    public static void main(String[] args) {
        StringBuilder str = new StringBuilder();
        str.append("i ").append("love ").append("blackbird.");
        String output = str.toString();
        System.out.println(output);
        str.setCharAt(0, 'u');
        System.out.println(str);
    }
}
```

## 顺带一提

这里提到了方法`equals()` 。事实上，对于所有非基本类型，都应该使用这个方法来判断对象之间是否相等。

| 基本类型 | 对应的引用类型      |
| :------- | :------------------ |
| boolean  | java.lang.Boolean   |
| byte     | java.lang.Byte      |
| short    | java.lang.Short     |
| int      | java.lang.Integer   |
| long     | java.lang.Long      |
| float    | java.lang.Float     |
| double   | java.lang.Double    |
| char     | java.lang.Character |

例如int对应的引用类型Integer
