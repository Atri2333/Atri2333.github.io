---
title: JAVA速成Day1——集合
date: 2024-04-09 20:35:30
tags: 
mathjax: true
---

# JAVA速成Day1——集合

主要针对南京大学软件学院机试

## 1. List

分为ArrayList和LinkedList

ArrayList可以理解为C++ STL的vector（

LinkedList则为链表实现动态数组

```java
import java.util.ArrayList;
import java.util.Scanner;


public class Main {
    public static void main(String[] args) {
        // 创建
        ArrayList<String> list = new ArrayList<>();
        // LinkedList<String> list = new LinkedList<>();
        
        // 添加
        list.add("blackbird");
        list.add("greybird");
        list.add("darkbird");

        // 获取第i个元素
        for (int i = 0; i < list.size(); i++) {
            String s = list.get(i);
            System.out.println(s);
        }
        // 迭代器遍历的for each
        for (String s : list) {
            System.out.println(s);
        }
        // 删除元素，下标从0开始
        list.remove(1);
        for (String s : list) {
            System.out.println(s);
        }
        // 修改元素
        list.set(1, "yy");
        for (String s : list) {
            System.out.println(s);
        }
    }
}
```

## 2. 数组排序

一般的数组升序排序：（这里的话，是可以指定排序范围的

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Scanner;


public class Main {
    int[] list = new int[110];
    int n;
    Scanner sc = new Scanner(System.in);
    void sol(){
        n = sc.nextInt();
        for(int i = 0; i < n; i++)
            list[i] = sc.nextInt();
        Arrays.sort(list, 0, n);
        for(int i = 0; i < n; i++)
            System.out.print(list[i] + " ");
        System.out.println();
    }
    public static void main(String[] args) {
        // 创建
        Main Solution = new Main();
        Solution.sol();
    }
}
```

降序的话，是需要自定义一个 `Comparator` 类的。

但是无论是Array.sort还是Collections.sort都没办法**同时**指定 `Comparator` 和下标范围。因此这里使用动态数组可能更为方便：

```java
import java.util.*;


public class Main {
    ArrayList<Integer> blackbird = new ArrayList<>();
    int n;
    Scanner sc = new Scanner(System.in);
    Comparator<Integer> cmp = new Comparator<Integer>() {
        @Override
        public int compare(Integer o1, Integer o2) {
            Integer val = o2 - o1;
            return val.intValue();
        }
    };
    void sol(){
        n = sc.nextInt();
        blackbird.clear();
        for(int i = 0; i < n; i++)
            blackbird.add(sc.nextInt());

        Collections.sort(blackbird, cmp);
        for(int i = 0; i < n; i++)
            System.out.print(blackbird.get(i) + " ");
        System.out.println();
    }
    public static void main(String[] args) {
        // 创建
        Main Solution = new Main();
        Solution.sol();
    }
}
```

对于 `Comparator` 类中，我们需要重写 `compare` 函数。如果参数一根据你想要的定义小于参数二，那么返回负整数。等于返回零。大于返回正整数。

另外，集合不支持 `int` 这种基本数据类型。需要使用对应的对象 `Integer` 。

## 3. 队列

在ACM里，队列的使用非常广泛，包括如下：

- BFS
- 单调队列，处理滑动窗口模型
- 优先队列模拟堆

个人认为，在ACM场景中，一般使用 `LinkedList` 实现普通队列：

```java
import java.util.*;


public class Main {
    // 创建队列
    Queue<String> q = new LinkedList<>();
    int n;
    Scanner sc = new Scanner(System.in);

    void sol(){
        // 添加元素
        q.offer("blackbird");
        q.offer("greybird");
        q.offer("darkbird");
        System.out.println(q);

        // 删除元素
        q.poll();
        System.out.println(q);

        // 队首
        System.out.println(q.peek());
        System.out.println(q.peek());

        // 队尾元素的话，Queue是不支持的，可能需要自己维护
    }
    public static void main(String[] args) {
        // 创建
        Main Solution = new Main();
        Solution.sol();
    }
}
```

关于优先队列，可能需要传入 `Comparator` 接口。这里我选择使用java来实现dijkstra+堆优化算法来作为示例：

```java
import java.util.*;


public class Main {
    static final int N = 200010;
    static int n, m, S, used=0;
    static Scanner sc = new Scanner(System.in);
    static int[] head = new int[N>>1];
    static int[] point = new int[N<<1];
    static int[] nxt = new int[N<<1];
    static int[] val = new int[N<<1];
    static int[] dis = new int[N>>1];
    static boolean[] vis = new boolean[N>>1];

    static void add(int u, int v, int w){
        point[++used] = v;
        nxt[used] = head[u];
        head[u] = used;
        val[used] = w;
    }

    static class node{
        int u, d;
        node(){}
        node(int _u, int _dis){u = _u; d = _dis;}
    }

    static void Dijkstra(){
        Comparator<node> cmp = new Comparator<node>() {
            @Override
            public int compare(node o1, node o2) {
                return o1.d - o2.d;
            }
        };
        PriorityQueue<node> q = new PriorityQueue<>(cmp);
        q.add(new node(S, 0));
        while(!q.isEmpty()){
            node nn = q.poll();
            int u = nn.u, d = nn.d;
            if(vis[u]) continue;
            vis[u] = true;
            for(int k = head[u]; k > 0; k = nxt[k]){
                int v = point[k];
                if(!vis[v] && dis[v] > dis[u] + val[k]){
                    dis[v] = dis[u] + val[k];
                    q.add(new node(v, dis[v]));
                }
            }
        }
    }
    static void sol(){
        n = sc.nextInt(); m = sc.nextInt(); S = sc.nextInt();
        for(int i = 1; i <= n; i++) dis[i] = 0x3f3f3f3f;
        dis[S] = 0;
        for(int i = 1; i <= m; i++){
            int u, v, w;
            u = sc.nextInt(); v = sc.nextInt(); w = sc.nextInt();
            add(u, v, w);
            add(v, u, w);
        }
        Dijkstra();
        for(int i = 1; i <= n; i++){
            System.out.print(dis[i] + " ");
        }
        System.out.println();
    }
    public static void main(String[] args) {
        sol();
    }
}
```

顺带一提，这玩意在洛谷上MLE了（

关于双端队列，同样采用 `LinkedList` 接口。

众所周知，单调队列通常使用双端队列实现，而单调队列的一个典型例子就是实现 $O(nV)$ 复杂度的多重背包：

```java
import java.util.*;


public class Main {
    static final int N = 20010;
    static Scanner sc = new Scanner(System.in);
    static int[][] f = new int[2][N];
    static int n, V;

    static void sol(){
        n = sc.nextInt(); V = sc.nextInt();
        int ans = 0;
        for(int i = 1; i <= n; i++){
            int ii = i & 1;
            int v, w, s;
            v = sc.nextInt(); w = sc.nextInt(); s = sc.nextInt();
            for(int j = 0; j < v; j++){
                Deque<Integer> q = new LinkedList<>();
                for(int k = j; k <= V; k += v){
                    while(!q.isEmpty() && k - q.peekFirst() > s * v) q.pollFirst();
                    while(!q.isEmpty() && f[ii^1][q.peekLast()] + (k - q.peekLast()) / v * w < f[ii^1][k])
                        q.pollLast();
                    q.addLast(k);
                    f[ii][k] = f[ii^1][q.peekFirst()] + (k - q.peekFirst()) / v * w;
                    ans = Math.max(ans, f[ii][k]);
                }
            }
        }
        System.out.println(ans);
    }
    public static void main(String[] args) {
        sol();
    }
}
```

可以把dp的式子转化一下，得到可以使用单调队列维护的形式。

## 4. Map

首先java中有 `HashMap` ，类似于C++中的unordered_map：

```java
import java.util.*;


public class Main {
    static final int N = 20010;
    static Scanner sc = new Scanner(System.in);


    static void sol(){
        HashMap<Integer, String> hashmap = new HashMap<>();
        // 添加key-value pair
        hashmap.put(520, "blackbird");
        hashmap.put(1314, "love u, ");
        hashmap.put(114514, "acm-icpc");
        // 获取值
        System.out.println(hashmap.get(1314) + hashmap.get(520));
        // 修改
        hashmap.put(114514, "fwyy");
        System.out.println(hashmap.get(114514));
        // 遍历
        for(Integer key: hashmap.keySet()){
            System.out.println(key + " -> " + hashmap.get(key));
        }
    }
    public static void main(String[] args) {
        sol();
    }
}
```

但是我们要是想要个有序的map，可以使用 `TreeMap` ：

```java
import java.util.*;


public class Main {
    static final int N = 20010;
    static Scanner sc = new Scanner(System.in);


    static void sol(){
        Comparator<Integer> cmp = new Comparator<Integer>() {
            @Override
            public int compare(Integer o1, Integer o2) {
                Integer sub = o1 - o2;
                return sub.intValue();
            }
        };
        Map<Integer, String> map = new TreeMap<>(cmp);
        // 添加key-value pair
        map.put(520, "blackbird");
        map.put(1314, "love u, ");
        map.put(666, "acm-icpc");
        // 获取值
        Integer key1314 = 1314;
        System.out.println(map.get(1314) + map.get(520));
        // 修改
        map.put(114514, "fwyy");
        System.out.println(map.get(114514));
        // 遍历
        for(Integer key: map.keySet()){
            System.out.println(key + " -> " + map.get(key));
        }
        // 查看是否存在键值对
        if(map.containsKey(520)){
            System.out.println("!!!!");
        }
    }
    public static void main(String[] args) {
        sol();
    }
}
```

可以使用自定义的 `Comparator` 。

**这里我给自己挖了个坑**，直接使用 `Map` 来定义。欸，是不是感觉少了点API了呢？hh

update（24.4.15）：

方法 `getOrDefault(key, v)` 。寻找key，若不存在则返回v。（source：leetcode 49）

## 5. Set

这里我只想讲红黑树实现的 `TreeSet` ，毕竟在ACM里一般都把set当平衡树来用（什么）

这里就不拿 `blackbird` 什么的当例子了，有点草（

```java
import java.util.*;


public class Main {
    static final int N = 20010;
    static Scanner sc = new Scanner(System.in);


    static void sol(){
        TreeSet<Integer> s = new TreeSet<>();
        s.add(1); s.add(3); s.add(1); s.add(4); s.add(5); s.add(2); s.add(0);
        s.add(2333);
        System.out.println(s.contains(114514));
        for(Integer num: s){
            System.out.print(num + " ");
        }
        System.out.println();
        // 小于等于
        System.out.println(s.floor(10)); // 5
        // 大于等于
        System.out.println(s.ceiling(4)); // 4
        // 小于
        System.out.println(s.lower(5)); // 4
        // 大于
        System.out.println(s.higher(5)); // 2333
        // 删除
        s.remove(2333);
        for(Integer num: s){
            System.out.print(num + " ");
        }
    }
    public static void main(String[] args) {
        sol();
    }
}
```

欸，那java里是否有像C++中 `multiset` 类似的数据结构呢？答案是没有（焯！）

但是根据 `stackoverflow` 上的解释，可以使用 `TreeMap<E, Integer>` 来模拟 `multiset` ，其中value是计数器。



关于java中的集合就先说这么多了。

晚安

------

update 24.5.1

`arraylist.toArray(T[] arr)`

将Arraylist转化为正宗数组的方法，参数为存数据的数组。未指定默认为 `Object[]`

例如 `arr.toArray(new int[arr.size()][2]);` (https://leetcode.cn/problems/merge-intervals/description/?envType=study-plan-v2&envId=top-100-liked)
