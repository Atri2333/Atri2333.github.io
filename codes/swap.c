#include<stdio.h>
extern int buf[];

int *bufp0 = &buf[0];
static int *bufp1;

void swap(){
    int tmp;
    bufp1 = &buf[1];
    tmp = *bufp0;
    *bufp0 = *bufp1;
    *bufp1 = tmp;
}