---
title: java-strategy
date: 2024-04-17 16:22:38
tags:
---

# JAVA速成Day5——策略模式

> 源自于Head First 设计模式 第一章

具体的idea是将一组算法封装到一个对象中。一个常见的例子是之前接触过的 `Comparator` ：

```java
Comparator<Integer> cmp = new Comparator<Integer>() {
        @Override
        public int compare(Integer o1, Integer o2) {
            Integer val = o2 - o1;
            return val.intValue();
        }
    };
```

自己实现策略模式的排序：

```java
public class Main {
    public static void main(String[] args) throws InterruptedException {
        String[] array = { "apple", "Pear", "Banana", "orange" };
        sort(array, String::compareToIgnoreCase);
        System.out.println(Arrays.toString(array));
    }

    static <T> void sort(T[] a, Comparator<? super T> c) {
        for (int i = 0; i < a.length - 1; i++) {
            for (int j = 0; j < a.length - 1 - i; j++) {
                if (c.compare(a[j], a[j + 1]) > 0) { // 注意这里比较两个元素的大小依赖传入的策略
                    T temp = a[j];
                    a[j] = a[j + 1];
                    a[j + 1] = temp;
                }
            }
        }
    }
}
```

而排序的规则，并不直接体现在 `sort` 内部。这就**避免了面向实现编程**。

例如，我们要实现不同的排序规则，我们可以首先定义一个接口：

```java
public interface sortStrategy{
	void sort(int[] array);
}
```

然后可以定义多个排序算法，实现该接口：

```java
public class QuickSort implements sortStrategy{
	public void sort(int[] array){
		...
	}
}

public class MergeSort implements sortStrategy{
	public void sort(int[] array){
		...
	}
}
```

要应用策略的话，可以通过多态特性：

```java
sortStrategy my_sort = new QuickSort();
```

如果该接口是一个类的字段，可以通过 `setter` 方式，很方便地修改其算法行为。这就是策略模式的精髓所在。
