---
title: opengl
date: 2025-02-27 19:33:03
tags:
---

# 可编程渲染管线

先来说说什么是渲染管线。管线的英文是pipeline，其实正确的翻译应该是流水线，或者一系列流程。那么渲染管线就可以看作我可以输入一堆原始图形数据，经过这个流水线，能得到每个像素颜色的输出。

渲染管线大致分为两个部分：一是将3D信息转换为2D信息，二是将2D信息转换为一系列有颜色的像素。具体流程如下图：

![pipeline](opengl/pipeline.png)

所有的这些阶段在不同的图形API（例如本文涉及的OpenGL）上都是高度专门化的，并且它们十分容易并行执行，因此可以将各个阶段的程序搬到GPU上去运行，由这些程序操纵被绑到GPU显存上的顶点数据，完成渲染工作。

其中有几个阶段是用户可编程的（上图蓝色部分），例如最常用到的vertex shader（将3D坐标转换为另一种3D坐标）和fragment shader（计算某个像素的颜色）。我们可以向OpenGL注入我们自己写的shader，所使用的语言就是GLSL（Games202需用）。

# crash course

## NDC（Normalized Device Coordinates）

这个在Games101提到MVP变换中有提及，它的中文叫做标准化设备坐标，就是x,y,z都是在[-1,1]的空间，对应的就是MVP中的Projection。

前面提到，Vertex shader的作用是将3D坐标装换成另外的3D坐标，因此可以推测出，MVP变换通常是在Vertex shader中进行的。

## VBO（Vertex Buffer Objects）

顶点缓冲对象，听上去是拿来存储顶点信息的，事实也正是如此，只不过后面加了个对象的概念。

对于OpenGL中的对象，它们都对应着一个ID。对于VBO，可以使用 `glGenBuffers` 来生成并获得对应ID：

```cpp
unsigned int VBO;
glGenBuffers(1, &VBO);
```

> 关于OpenGL的API详细文档，推荐查阅 [docs.gl](https://docs.gl)

既然VBO内部其实是Buffer，那么就会有很多其它的Buffer Object，因此需要分个类，俗称缓冲类型。VBO的缓冲类型是GL_ARRAY_BUFFER（没毛病，其实就是数组）。

OpenGL实质上是一个状态机，因此在渲染流程中，要渲染的VBO应该属于当前的OpenGL上下文，即被绑定。要绑定某个VBO，可以：

```cpp
glBindBuffer(GL_ARRAY_BUFFER, VBO);  
```

绑定完成后，我们对于任何VBO（GL_ARRAY_BUFFER）的修改，都会影响到这个被绑定的VBO。

说了半天，我们VBO内部是要有顶点的，那么数据在哪呢？我们可以自己定义一个float数组：

```
float vertices[] = {
    -0.5f, -0.5f, 0.0f,
     0.5f, -0.5f, 0.0f,
     0.0f,  0.5f, 0.0f
};
```

这里有三个顶点，顶点属性尚且只有坐标（其实可以加上颜色、法向等）。可以观察到所有坐标都是在NDC范围内的。
