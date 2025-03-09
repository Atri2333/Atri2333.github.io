---
title: move_semantics_cpp
date: 2024-04-25 10:04:13
tags:
---

# C++移动语义&智能指针

> 摘自https://www.learncpp.com/cpp-tutorial/

在一个局部函数内部new一个对象，我们容易忘记对它delete，从而造成内存泄漏：

```cpp
#include <iostream>

void someFunction()
{
    Resource* ptr = new Resource();

    int x;
    std::cout << "Enter an integer: ";
    std::cin >> x;

    if (x == 0)
        throw 0; // the function returns early, and ptr won’t be deleted!

    // do stuff with ptr here

    delete ptr;
}
```

对此，我们可以采用RAII编程范例：通过局部变量的自动析构性，定义一个Auto_ptr1类：

```cpp
#include <iostream>

template <typename T>
class Auto_ptr1
{
	T* m_ptr {};
public:
	// Pass in a pointer to "own" via the constructor
	Auto_ptr1(T* ptr=nullptr)
		:m_ptr(ptr)
	{
	}

	// The destructor will make sure it gets deallocated
	~Auto_ptr1()
	{
		delete m_ptr;
	}

	// Overload dereference and operator-> so we can use Auto_ptr1 like m_ptr.
	T& operator*() const { return *m_ptr; }
	T* operator->() const { return m_ptr; }
};

// A sample class to prove the above works
class Resource
{
public:
    Resource() { std::cout << "Resource acquired\n"; }
    ~Resource() { std::cout << "Resource destroyed\n"; }
};

int main()
{
	Auto_ptr1<Resource> res(new Resource()); // Note the allocation of memory here

        // ... but no explicit delete needed

	// Also note that we use <Resource>, not <Resource*>
        // This is because we've defined m_ptr to have type T* (not T)

	return 0;
} // res goes out of scope here, and destroys the allocated Resource for us
```

将指针包含在类里，通过类的析构函数，可以做到自动释放内存。

但是这么做会有问题，例如两个Auto_ptr1可能管理同一个指针：

```cpp
int main()
{
	Auto_ptr1<Resource> res1(new Resource());
	Auto_ptr1<Resource> res2(res1); // Alternatively, don't initialize res2 and then assign res2 = res1;

	return 0;
}
```

这样会对同一个地址delete两次，造成ub。

同样地，如果将Auto_ptr1作为函数参数或者函数返回值，都会出现奇怪的问题。

因此一种解决方式，是采用**移动语义**：通过转移ownership来替代浅拷贝：

```cpp
#include <iostream>

template <typename T>
class Auto_ptr2
{
	T* m_ptr {};
public:
	Auto_ptr2(T* ptr=nullptr)
		:m_ptr(ptr)
	{
	}

	~Auto_ptr2()
	{
		delete m_ptr;
	}

	// A copy constructor that implements move semantics
	Auto_ptr2(Auto_ptr2& a) // note: not const
	{
		// We don't need to delete m_ptr here.  This constructor is only called when we're creating a new object, and m_ptr can't be set prior to this.
		m_ptr = a.m_ptr; // transfer our dumb pointer from the source to our local object
		a.m_ptr = nullptr; // make sure the source no longer owns the pointer
	}

	// An assignment operator that implements move semantics
	Auto_ptr2& operator=(Auto_ptr2& a) // note: not const
	{
		if (&a == this)
			return *this;

		delete m_ptr; // make sure we deallocate any pointer the destination is already holding first
		m_ptr = a.m_ptr; // then transfer our dumb pointer from the source to the local object
		a.m_ptr = nullptr; // make sure the source no longer owns the pointer
		return *this;
	}

	T& operator*() const { return *m_ptr; }
	T* operator->() const { return m_ptr; }
	bool isNull() const { return m_ptr == nullptr; }
};

class Resource
{
public:
	Resource() { std::cout << "Resource acquired\n"; }
	~Resource() { std::cout << "Resource destroyed\n"; }
};

int main()
{
	Auto_ptr2<Resource> res1(new Resource());
	Auto_ptr2<Resource> res2; // Start as nullptr

	std::cout << "res1 is " << (res1.isNull() ? "null\n" : "not null\n");
	std::cout << "res2 is " << (res2.isNull() ? "null\n" : "not null\n");

	res2 = res1; // res2 assumes ownership, res1 is set to null

	std::cout << "Ownership transferred\n";

	std::cout << "res1 is " << (res1.isNull() ? "null\n" : "not null\n");
	std::cout << "res2 is " << (res2.isNull() ? "null\n" : "not null\n");

	return 0;
}
/*
Resource acquired
res1 is not null
res2 is null
Ownership transferred
res1 is null
res2 is not null
Resource destroyed
*/
```

这其实就是早期 `std::auto_ptr` 的写法。但是这个东西是很危险的，以至于在C++17标准中被删除。例如你将auto_ptr传入函数（并在函数结束时析构），但是调用者函数的对应的auto_ptr并不知道自己维护的指针已经释放了。二是auto_ptr没办法采用数组delete（挖坑，数组delete和普通delete的区别），三是auto_ptr没办法与STL容器很好地交互。

------

介绍移动语义之前，需要了解一下右值引用的性质。

要知道，函数的返回值是右值（然后用赋值`=`赋给左值），而右值引用可以延长返回值的生命周期：

```cpp
#include <iostream>

class Fraction
{
private:
	int m_numerator { 0 };
	int m_denominator { 1 };

public:
	Fraction(int numerator = 0, int denominator = 1) :
		m_numerator{ numerator }, m_denominator{ denominator }
	{
	}

	friend std::ostream& operator<<(std::ostream& out, const Fraction& f1)
	{
		out << f1.m_numerator << '/' << f1.m_denominator;
		return out;
	}
};

int main()
{
	auto&& rref{ Fraction{ 3, 5 } }; // r-value reference to temporary Fraction

	// f1 of operator<< binds to the temporary, no copies are created.
	std::cout << rref << '\n';

	return 0;
} // rref (and the temporary Fraction) goes out of scope here
```

那，考虑将右值和右值引用作为函数参数，会是什么情况呢？

```cpp
#include <iostream>

void fun(const int& lref) // l-value arguments will select this function
{
	std::cout << "l-value reference to const: " << lref << '\n';
}

void fun(int&& rref) // r-value arguments will select this function
{
	std::cout << "r-value reference: " << rref << '\n';
}

int main()
{
	int x{ 5 };
	fun(x); // l-value argument calls l-value version of function
	fun(5); // r-value argument calls r-value version of function

	return 0;
}
/*
l-value reference to const: 5
r-value reference: 5
*/
```

可以发现，当我们传入一个右值5，会采用形参为右值引用的重载函数。相比于const的左值引用（可以用右值初始化const左值引用），编译器认为右值引用是更好的选择。

那传入右值引用呢？

```cpp
#include <iostream>

void fun(const int& lref) // l-value arguments will select this function
{
	std::cout << "l-value reference to const: " << lref << '\n';
}

void fun(int&& rref) // r-value arguments will select this function
{
	std::cout << "r-value reference: " << rref << '\n';
}

int main()
{
	int&& ref{ 5 };
    fun(ref);

	return 0;
}
/*
l-value reference to const: 5
*/
```

我操，居然右值引用是左值。这说明 `int&& ref` 是 `int&&` 类型的左值。

另外，根据learncpp，和不能返回左值引用一样，你也不能返回右值引用（虽然本身返回的是int&&类型的左值，但是它引用的是一个生命周期已经结束的右值，这很危险）

------

我们知道，const左值引用可以接受右值为参数。这里看看learncpp的copy类型auto_ptr：

```cpp
#include <iostream>

template<typename T>
class Auto_ptr3
{
	T* m_ptr {};
public:
	Auto_ptr3(T* ptr = nullptr)
		: m_ptr { ptr }
	{
	}

	~Auto_ptr3()
	{
		delete m_ptr;
	}

	// Copy constructor
	// Do deep copy of a.m_ptr to m_ptr
	Auto_ptr3(const Auto_ptr3& a)
	{
		m_ptr = new T;
		*m_ptr = *a.m_ptr;
	}

	// Copy assignment
	// Do deep copy of a.m_ptr to m_ptr
	Auto_ptr3& operator=(const Auto_ptr3& a)
	{
		// Self-assignment detection
		if (&a == this)
			return *this;

		// Release any resource we're holding
		delete m_ptr;

		// Copy the resource
		m_ptr = new T;
		*m_ptr = *a.m_ptr;

		return *this;
	}

	T& operator*() const { return *m_ptr; }
	T* operator->() const { return m_ptr; }
	bool isNull() const { return m_ptr == nullptr; }
};

class Resource
{
public:
	Resource() { std::cout << "Resource acquired\n"; }
	~Resource() { std::cout << "Resource destroyed\n"; }
};

Auto_ptr3<Resource> generateResource()
{
	Auto_ptr3<Resource> res{new Resource};
	return res; // this return value will invoke the copy constructor
}

int main()
{
	Auto_ptr3<Resource> mainres;
	mainres = generateResource(); // this assignment will invoke the copy assignment

	return 0;
}
/*
mine:
Resource acquired
Resource acquired
Resource destroyed
Resource destroyed

learncpp:
Resource acquired
Resource acquired
Resource destroyed
Resource acquired
Resource destroyed
Resource destroyed
*/
```

按理来说应该有六行，但是我的编译器忽略了返回值。

> 挖坑，`Auto_ptr3& operator=(const Auto_ptr3& a)` 前面引用的含义 `&` ，它防止又调用一次copy constructor

这样我们就实现了一个基于copy的智能指针。但是，通过移动语义，可以做的更好。

C++11为类提供了移动构造函数和移动赋值重载，它们的参数都是右值引用：

```cpp
#include <iostream>

template<typename T>
class Auto_ptr4
{
	T* m_ptr {};
public:
	Auto_ptr4(T* ptr = nullptr)
		: m_ptr { ptr }
	{
	}

	~Auto_ptr4()
	{
		delete m_ptr;
	}

	// Copy constructor
	// Do deep copy of a.m_ptr to m_ptr
	Auto_ptr4(const Auto_ptr4& a)
	{
		m_ptr = new T;
		*m_ptr = *a.m_ptr;
	}

	// Move constructor
	// Transfer ownership of a.m_ptr to m_ptr
	Auto_ptr4(Auto_ptr4&& a) noexcept
		: m_ptr(a.m_ptr)
	{
		a.m_ptr = nullptr; // we'll talk more about this line below
	}

	// Copy assignment
	// Do deep copy of a.m_ptr to m_ptr
	Auto_ptr4& operator=(const Auto_ptr4& a)
	{
		// Self-assignment detection
		if (&a == this)
			return *this;

		// Release any resource we're holding
		delete m_ptr;

		// Copy the resource
		m_ptr = new T;
		*m_ptr = *a.m_ptr;

		return *this;
	}

	// Move assignment
	// Transfer ownership of a.m_ptr to m_ptr
	Auto_ptr4& operator=(Auto_ptr4&& a) noexcept
	{
		// Self-assignment detection
		if (&a == this)
			return *this;

		// Release any resource we're holding
		delete m_ptr;

		// Transfer ownership of a.m_ptr to m_ptr
		m_ptr = a.m_ptr;
		a.m_ptr = nullptr; // we'll talk more about this line below

		return *this;
	}

	T& operator*() const { return *m_ptr; }
	T* operator->() const { return m_ptr; }
	bool isNull() const { return m_ptr == nullptr; }
};

class Resource
{
public:
	Resource() { std::cout << "Resource acquired\n"; }
	~Resource() { std::cout << "Resource destroyed\n"; }
};

Auto_ptr4<Resource> generateResource()
{
	Auto_ptr4<Resource> res{new Resource};
	return res; // this return value will invoke the move constructor
}

int main()
{
	Auto_ptr4<Resource> mainres;
	mainres = generateResource(); // this assignment will invoke the move assignment

	return 0;
}
/*
Resource acquired
Resource destroyed
*/
```

认真看一下移动语义的实现~（挖坑：`noexcept`

由于Resource自始自终都只有一个（只不过所有权转移了很多次），因此只有一次构造和一次析构。

我们将移动语义与右值挂钩。这是因为右值一般来讲都是暂时使用的东西，在以后的程序执行不需要使用。因此比起前面使用左值来实现移动语义，右值更加安全。我们不希望类似于 `a=b` 这种东西会影响到 `b` 。

我们观察到，函数 `generateResource` 返回的是一个左值，但是似乎根据结果来看，返回过程采用了移动语义（即没有构造新值）。这是可以的，C++内部也是这么干的。因为返回的左值在离开函数后会立即销毁，我们没必要在这里使用深拷贝。

learncpp网站上给出建议：对于move-enabled的类，有时候禁止使用拷贝构造和拷贝赋值会更好：

```cpp
#include <iostream>

template<typename T>
class Auto_ptr5
{
	T* m_ptr {};
public:
	Auto_ptr5(T* ptr = nullptr)
		: m_ptr { ptr }
	{
	}

	~Auto_ptr5()
	{
		delete m_ptr;
	}

	// Copy constructor -- no copying allowed!
	Auto_ptr5(const Auto_ptr5& a) = delete;

	// Move constructor
	// Transfer ownership of a.m_ptr to m_ptr
	Auto_ptr5(Auto_ptr5&& a) noexcept
		: m_ptr(a.m_ptr)
	{
		a.m_ptr = nullptr;
	}

	// Copy assignment -- no copying allowed!
	Auto_ptr5& operator=(const Auto_ptr5& a) = delete;

	// Move assignment
	// Transfer ownership of a.m_ptr to m_ptr
	Auto_ptr5& operator=(Auto_ptr5&& a) noexcept
	{
		// Self-assignment detection
		if (&a == this)
			return *this;

		// Release any resource we're holding
		delete m_ptr;

		// Transfer ownership of a.m_ptr to m_ptr
		m_ptr = a.m_ptr;
		a.m_ptr = nullptr;

		return *this;
	}

	T& operator*() const { return *m_ptr; }
	T* operator->() const { return m_ptr; }
	bool isNull() const { return m_ptr == nullptr; }
};
```

这个东西非常像 `std::unique_ptr` 。正如其名，`unique` 的性质让它不能被复制。

------

`std::move` 用于将左值转化为右值，这样可以使用移动语义：

```cpp
int main()
{
	std::string a, b;
	b = "nuaa is garbage";
	a = std::move(b);
	std::cout << "a=" <<a << '\n' << "b=" << b;
	return 0;
}
/*
a=nuaa is garbage
b=
*/
```

但是原有的字符串b变为了空值，这也是意料之内的。

但是根据learncpp上的建议：不要对任何被std::move后的对象的值有任何假设

因此我们以后要避免依赖b的具体的值的操作。

