---
title: Z-algorithm
date: 2024-05-05 16:04:48
tags:
mathjax: true
---

# Z算法（exkmp）

这算法和马拉车非常像，它用来在 $O(n)$ 的时间内求一个 $Z$ 函数，其中 $Z_i$ 代表以 $S_i$ 开头的字符串与 $S$ 的lcp的长度。

Z-box：设 $Z_i \neq 0$，则定义区间 $[i, i+Z_i-1]$ 为一个Z-box。

对于 $i=0$ ，按定义来看 $Z_0=n$，但是有时候会令 $Z_0 = 0$，这个看具体题目的情况。

和马拉车非常像，Z算法也是采用dp的思路。

它在遍历的时候，维护一个Z-box区间 $[l,r]$，其中 $r$ 是当前遇到的所有Z-box区间中最大的。

然后分类讨论：

$i > r$，这时候如果 $Z_i \neq 0$，那么它所代表的Z-box的右边界更大，这里直接暴力做。

$i \le r$，这时候通过画图可以知道 $S[i-l, r-l] = S[i,r]$，因此我们考虑 $Z_{i-l}$。

若 $Z_{i-l} \le r-i$，这代表 $Z_i$ 也会 $\le r-i$，因此 $Z_i = Z_{i-l}$。

否则 $Z_i$ 会突破右边界，对于突破右边界的情况，暴力即可。

```c++
int Z[_];
void exkmp(const string &s){
	int n = s.length();
	for(int i = 1, l = 0, r = 0; i < n; i++){
		if(Z[i-l] <= r - i)
			Z[i] = Z[i-l];
		else{
			Z[i] = max(r - i + 1, 0);
			while(i + Z[i] < n && s[i+Z[i]] == s[Z[i]]) ++Z[i];
			l = i; r = i + Z[i] - 1;
		}
	}
}
```

因为右边界只会增加 $O(n)$ 次，因此复杂度为 $O(n)$。

例题：https://www.luogu.com.cn/problem/P5410

https://codeforces.com/contest/1968/problem/G2
