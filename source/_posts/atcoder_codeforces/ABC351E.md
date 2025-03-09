---
title: ABC351E
date: 2024-05-01 16:25:43
tags:
mathjax: true
---

# **ABC351E - Jump Distance Sum**

## 题意

二维平面上有 $n$ 个点，对于横纵坐标之和具有相同奇偶性的点，距离为切比雪夫距离。否则距离为0.

求所有点对之间的距离之和。

## 切比雪夫距离与曼哈顿距离的转换

这题我在比赛中没想出来，虽然退役了，但还是有点丢人。

其实这是个很常见的套路了：将难求的切比雪夫距离转换为好求的曼哈顿距离。

先考虑曼哈顿距离的式子，它比较简单：
$$
|x_1-x_2|+|y_1-y_2|.
$$
然后考虑到切比雪夫有 $\max$ 之类的东西，我们可以将上式进行转化：
$$
\max{(x_1-x_2+y_1-y_2,x_1-x_2+y_2-y_1,x_2-x_1+y_1-y_2,x_2-x_1+y_2-y_1)}.
$$
乐，其实就是四种情况取最大值。$x_1,y_1,x_2,y_2$ 中两项取正，两项取负。

然后考虑切比雪夫距离：
$$
\max{(|x_1-x_2|,|y_1-y_2|)}.
$$
展开：
$$
\max{(x_1-x_2,x_2-x_1,y_1-y_2,y_2-y_1)}.
$$
我操，也是四项。

那么，令 $x_i=x_i+y_i, y_i=x_i-y_i$，代入一下，你会发现，卧槽，和曼哈顿的形式一样！

**总结**

所以，求曼哈顿距离时，可以将点 $(x,y)$ 变成 $(x+y,x-y)$，然后求切比雪夫距离。

反之，求切比雪夫距离时，可以将点 $(x,y)$ 变成 $(\frac{x+y}{2}, \frac{x-y}{2})$，然后求曼哈顿距离。

## 解法

先将所有的点按奇偶性分两块，对每一块内部进行上面切比雪夫->曼哈顿的转化，然后求总距离是很简单的。

```java
public class Main {
    static Scanner sc = new Scanner(System.in);
    static final int N = 1010;


    public static void main(String[] args) {
        int n = sc.nextInt();
        ArrayList<Integer>[] A = new ArrayList[4];
        for(int i = 0; i < 4; i++) A[i] = new ArrayList<>();
        for(int i = 0; i < n; i++){
            int x = sc.nextInt();
            int y = sc.nextInt();
            if((x+y)%2==0){ // 转化，这里不除二，在最后答案再除二
                A[0].add(x+y);
                A[1].add(x-y);
            }else{
                A[2].add(x+y);
                A[3].add(x-y);
            }
        }
        long ans = 0;
        for(int i = 0; i < 4; i++){
            Collections.sort(A[i]);
            long s = 0; int cnt = 0;
            for(int x: A[i]){
                ++cnt; s += x;
                ans += (long)cnt * x - s;
            }
        }
        System.out.println(ans/2);
    }
}
```

