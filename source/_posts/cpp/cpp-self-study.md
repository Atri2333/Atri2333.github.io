---
title: cpp_self_study
date: 2024-07-10 17:24:23
tags:
---

> 查缺补漏，重点整理

## 引用

> 这里先只谈左值引用。引用和被引用变量**是一回事**，个人认为实质上是二者所代表的变量**地址相同**。

### 函数返回值是引用

例如：

```c++
#include<iostream>
int n;
int &fuck(){return n;}
int main(){
    fuck() = 2;
    std::cout << n; // 2
    return 0;
}
```

可以将函数调用作为赋值对象。

### 常引用

指的是 `const int &`，不能通过常引用去修改其引用的变量。

不能将常引用初始化给非常引用：

```cpp
const int &p = n;
int &q = p;
// compile error
```

## 函数重载

> 这里重载的定义是：函数名相同，函数参数个数或参数类型不同。
>
> 因此，函数**参数列表相同但返回值类型不同**，是**不允许重载**的。
>
> 如果在类里，还可以通过分别定义非常量成员函数和常量成员函数（函数定义后面加 `const` ）来重载。

例：

```cpp
int fuck(int n){return n;}
long long fuck(int m){return 1ll * m * m;}
// 1.cpp:4:11: error: ambiguating new declaration of 'long long int fuck(int)'
```

## 函数缺省参数

> 指的是可以给函数参数列表后面几个连续的参数默认值。

```cpp
int fuck(int n, int m = 0){return n + m;}
```

这里主要理解缺省参数存在的意义，它主要是为了优化程序的**可扩充性**。在初步进行需求开发时，可能对于一个接口的功能并没有完善的规划。到后期有了更完善的需求，可能会在同一个接口上扩充功能。这时可以在该接口（这里指函数）后面添加缺省参数，通过这个缺省参数来在扩充功能的同时，保证原程序中无需扩充功能的函数调用不需要修改调用形式（即一个一个在函数尾部添加参数）。

然后提醒一下，对于重载+缺省产生的二义性：

```cpp
int fuck(int n = 1){return n * 2;}
int fuck(){return 1;}
```

当使用 `fuck()` 调用时，产生的二义性会让编译器产生错误。

## 类

### 私有成员

这里主要提醒一件事情，就是对于 `private` 修饰的成员，只能在成员函数内部访问。但是成员函数内部可以访问自己以及**其它相同类**的私有成员：

```cpp
class fuck{
    private:
    int shit;
    void printshit(fuck *a){
        std::cout << shit + a->shit << std::endl;
    }
};
// ok
```

### 复制构造函数

> 指的是形如 `T (T &)` 或 `T (const T &)` 这样的用另一个对象的**引用**来初始化该对象的构造函数。如果不自己定义，会自动生成一个默认的复制构造函数。
>
> 新增tip：对于封闭类，编译器为其生成默认的复制构造函数时，会按照先调用其成员对象的**复制构造函数**的规则生成，而不是无参构造函数。

复制构造函数在三种情况下起作用：

- 用一个对象去初始化另一个对象：`Complex c2(c1);`，`Complex c2 = c1; //初始化，不是赋值` 
- 一个函数中有一个参数是类A的对象，调用该函数时，类A的复制构造函数会被调用。
- 函数的返回值是类A的对象，则函数返回时会被调用，将返回值赋值给**临时对象**（注意）。

> 当然，像g++这种编译器可能会进行优化，可能不会生成临时对象，就少了中间的临时对象的复制构造函数和析构函数的调用（不愧是g++，主打一个激进）。而msvc这种就会按照C++的规定来编译。

### 类型转换构造函数

> 之前没听说过

指的是只有一个参数的构造函数。

这样无论是使用 `=` 进行赋值还是初始化，可以进行自动类型转换。具体看例子吧：

```cpp
#include<iostream>
class Complex{
public:
    double real, imag;
    Complex(int i){ // 类型转换构造函数
        std::cout << "IntConstructor called" << std::endl;
        real = i; imag = 0;
    }    
    Complex(double r, double i){
        real = r;
        imag = i;
        std::cout << "CommonConstructor called" << std::endl;
    }
};
int main(){
    Complex c1(7, 8);
    Complex c2 = 12;
    c1 = 9; // 9被转换成一个临时Complex对象，然后赋值给c1，在前面转换的过程中会调用类型转换构造函数
    std::cout << c1.real << "," << c1.imag << std::endl;
    return 0;
}
```

### 静态成员

对于类的静态变量，需要在定义类的文件中对其进行一次说明或初始化，否则会发生**链接错误**：

```cpp
#include<iostream>
class Complex{
public:
    double real, imag;
    static int total_number;
    Complex(int i){ // 类型转换构造函数
        std::cout << "IntConstructor called" << std::endl;
        real = i; imag = 0;
    }    
    Complex(double r, double i){
        real = r;
        imag = i;
        std::cout << "CommonConstructor called" << std::endl;
    }
    ~Complex(){
        std::cout << "Destructor called" << std::endl;
    }
};
Complex fun(Complex tmp){
    return tmp;
}
int Complex::total_number = 0; // 初始化
int main(){
    std::cout << Complex::total_number;
    return 0;
}
```

> 思考：如何维护这个total_number呢？应该在怎么样的构造函数和析构函数来实时维护该变量？

### 封闭类构造函数/析构函数

> 封闭类：含有**成员对象**的类

封闭类对象生成时，先执行所有对象成员的构造函数（按照类中的说明次序，与初始化列表顺序无关），然后执行封闭类的构造函数。

封闭类对象消亡时，先执行封闭类对象的析构函数，再执行成员对象的析构函数（按照构造函数调用的反序）。

### 重载自增自减运算符

Tip：C++约定俗成的规则，就是前置形式的 `++c` 返回的是对象 `c` 的引用，`c++` 返回的是新的对象。

因此可以这么写 `(++c)=1` 。重载的时候注意返回值类型。

> 可以注意到前置的自增自减运算符效率更高，因为后置的情况会导致对象的拷贝。这也是为什么我喜欢在acm中写for循环喜欢写 `for(int i = 0; i < n; ++i)` ，当然对于内置整形变量其实无所谓了，更看个人风格。

### protected

派生类可以访问的是当前对象的基类对象的protected成员，而不能访问**非当前对象**的protected成员。

### 多态

主要有两种表现方式：基类指针指向派生类对象、基类引用派生类对象

Tip：在类的成员函数（非构造、非析构）中调用虚函数，等价于 `this` 指针调用虚函数，表现为多态。**而如果是构造函数和析构函数就不是多态**（想想也是嘛，多态函数得等对象初始化完才能用）。

Tip2：派生类中和基类的虚函数同名同参数表的函数可以不加 `virtual` 。

Tip3：析构函数建议使用 `virtual` ，构造函数不能是虚函数。

## 模板

### 模板的实例化

> 指的是将具体的类型替换模板函数里的类型

可以不通过参数实例化函数模板：

```cpp
#include<iostream>
using namespace std;
template <class T>
T Inc(T n){
	return n+1;
}
int main(){
	cout << Inc<double>(4)/2; //强制用double替换
	return 0;
}
// 2.5
```

### 函数模板和次序

在有多个函数和函数模板名字相同的情况下，编译器如下处理一条函数调用语句：

1. 先找参数完全匹配的普通函数
2. 再找参数完全匹配的模板函数
3. 再找实参经过自动类型转换后能够匹配的**普通函数**（注意）。
4. 报错

因此下面这个程序会编译错误：

```cpp
#include<iostream>
using namespace std;
template <class T>
void f1(T n, T m){
	cout << "fuck\n";
}
int main(){
	f1(1.1, 2);
	return 0;
}
```

编译器不会把 `f1` 的第二个参数 `2` 自动转换为 `double` 类型。不能使用自动类型转换后的模板函数，个人认为这是为了防止二义性。

### 类模板

类模板的"<类型参数表>"中可以出现非类型参数：`template <class T, int size>`。

### 类模板初始化静态成员

对于相同的类模板实例化出来的不同的模板类，对应的 `static` 成员不一样，但是都要初始化：

```cpp
template<> int A<int>::count = 0;
template<> int A<double>::count = 0;
```

## STL

### STL中“相等”的概念

有时，“x和y相等”等价于“x==y为真”：

例，在未排序的区间上进行的算法，例如顺序查找 `find`

但有时，"x和y相等"等价于"x小于y和y小于x同时为假"

例：有序区间算法，如`binary_search` ，或关联容器自身的成员函数 `find` 。

> 这玩意有点抽象，遇到坑的时候再补充吧

------

> 以上是暑假找某些面向对象的C++教程瞎学的
>
> 接下来是这学期重新从头学的笔记~

## 常量

### 常量分为编译时常量和运行时常量

关键字 `constexpr` 用于定义一个编译时常量，编译时常量的值需要在编译期就被确定，以方便被编译器优化。

只能使用 `const expression` 来初始化 `constexpr` ，这也是 `constexpr` 的命名来源，初始化所用表达式的值可以通过编译期就被确定。

另外地，使用 `const` 修饰的**非整型**常量只能是运行时常量，即便是用常量表达式来初始化（具体原因待解），可以通过 `constexpr` 来显式定义非整型编译时常量。

### constexpr 函数

为了让函数调用能够出现在常量表达式中，可以采用对函数返回值进行 `constexpr` 修饰，来说明该函数返回值可以在编译期求出。

对于 `constexpr` 函数，需要满足以下条件：

- 函数调用时传进去的参数必须也在编译器中求出
- 函数内部的语句以及表达式都可以在编译器中求出

当然这不代表 `constexpr` 函数的任何调用处都得在编译期求出，它在运行时表达式中和非 `constexpr` 函数表现一致。

例如：

```cpp
#include <iostream>

constexpr int getValue(int x)
{
    return x;
}

int main()
{
    int x { getValue(5) }; // may evaluate at runtime or compile-time

    return 0;
}
```

由于 `x` 是变量，虽然初始化表达式是 `constexpr` ，但是是否用编译期常量优化由编译器实现而定。

## 内联 `inline`

早期 `inline` 关键字修饰的函数为内联函数，主要用于将函数体在调用处进行展开，减少调用时产生的额外开销。

然而现代编译器有足够能力判断一个函数调用是否用函数展开来替代会提升整体性能（毕竟太多次函数展开会增大可执行文件体积，导致负优化），因此 `inline` 在现代C++编译器中主要的用途是告诉编译器该函数可以有重复定义（ODR-exemption）。

`inline` 修饰的函数必须满足：

- 每个翻译单元中调用处在编译时能够确定函数内容（即在当前cpp源文件中该函数被定义过，如果只有前向定义会报编译错误）
- 所有同名的 `inline` 函数是一样的，否则UB（因为链接的时候链接器会去除重复的`inline` 函数定义，选择其中一个。具体选择哪个，不知道）。

`inline` 函数经常定义在**header-only libraries**中（不包括 .cpp 文件的库，这种库不需要提前设置默认链接路径，因为根本就没东西被链接，只需要 `#include` 就行了）

`C++17` 标准定义了 `inline` 修饰的变量，具体用途和内联函数差不多。至于它和全局变量之间的优劣比较，待解。

### constexpr函数是隐含的内联函数

因为编译是对于单个文件而言的，因此在编译期间，内联函数需要进行函数展开时，我们需要函数的定义。

对于constexpr函数，在 `const expression` 环境下，同样需要其定义，以便知道其编译期的值。（需要注意，声明一个constexpr函数只是代表它可以出现在常量表达式中，但不代表它将在编译期中求得值，某些运行时表达式也可使用constexpr函数）

因此很多constexpr函数也定义在头文件中。

> constexpr变量并非内联变量，需要显式加inline。

### constexpr只是多了一个可以用于常量表达式的功能

具体如下：

```cpp
#include <iostream>

constexpr int greater(int x, int y)
{
    return (x > y ? x : y);
}

int main()
{
    constexpr int g { greater(5, 6) };              // case 1: always evaluated at compile-time
    std::cout << g << " is greater!\n";

    std::cout << greater(5, 6) << " is greater!\n"; // case 2: may be evaluated at either runtime or compile-time

    int x{ 5 }; // not constexpr but value is known at compile-time
    std::cout << greater(x, 6) << " is greater!\n"; // case 3: likely evaluated at runtime

    std::cin >> x;
    std::cout << greater(x, 6) << " is greater!\n"; // case 4: always evaluated at runtime

    return 0;
}
```

## 作用域、生命周期、链接域

> scope、duration、linkage，后面我就不翻译了，也不知道怎么翻译

https://www.learncpp.com/cpp-tutorial/scope-duration-and-linkage-summary/

