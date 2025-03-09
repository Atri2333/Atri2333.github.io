---
title: ABC351E
date: 2024-10-06 19:30:43
tags:
mathjax: true
---

# 一类套路题

有两种购买物品的方式，花p元购买a个物品或者花q元购买b个物品。求至少买w个物品的情况下，花钱的最少数。

这种套路题用数学表示为，在满足 $ax+by \ge w$ 的情况下，最小化 $px+qy$ 的值。

## 解法

怎么做呢？首先你可能会想到用斜率+贪心的方法，但这肯定是错的。

事实上有这么一个结论：

> 不可能同时用花p元的方式购买b次且用花q元的方式购买a次。

如何证明呢？首先我们考虑购买ab个物品，如果用p元的方法会花pb元，而用另一种方法会花qa元。

如果我们同时购买很多次ab个物品，那么一定会只使用花费为pb或者qa中的一种的方法，看二者哪个更小。

因此的话，有种 $O(a+b)$ 的方法：从 $[0,b-1]$ 枚举花p元的方式，再从 $[0, a-1]$ 枚举花q元的方式。

## ABC374E

在上面套路添加了一层二分，事实上二分很好想，但上面的贪心套路才是关键。

这里会爆 `int` ，因此我为了方便就 `#define int long long` 了。

```cpp
#include<bits/stdc++.h>
typedef long long ll;
#define int long long
constexpr int _{110};

int a[_], b[_], p[_], q[_];
int n, x;
signed main()
{
	std::cin >> n >> x;
	for(int i = 0; i < n; ++i)
		std::cin >> a[i] >> p[i] >> b[i] >> q[i];
	int l{1}, r{1000000000};
	int ans{};
	while(l <= r)
	{
		int mid{l+r>>1};
		ll sum{};
		for(int i = 0; i < n; ++i)
		{
			int smn{x+1};
			for(int j = 0; j < b[i]; ++j)
			{
				int s{};
				if(j * a[i] >= mid)
				{
					s = j * p[i];
				}
				else
				{
					s = j * p[i] + (mid - j * a[i] + b[i] - 1) / b[i] * q[i];
				}
				smn = std::min(smn, s);
			}
			for(int j = 0; j < a[i]; ++j)
			{
				int s{};
				if(j * b[i] >= mid)
				{
					s = j * q[i];
				}
				else
				{
					s = j * q[i] + (mid - j * b[i] + a[i] - 1) / a[i] * p[i];
				}
				smn = std::min(smn, s);
			}

			sum += smn;
		}

		if(sum <= x)
		{
			ans = mid;
			l = mid + 1;
		}
		else
		{
			r = mid - 1;
		}
	}
	std::cout << ans;
	return 0;
}
```

