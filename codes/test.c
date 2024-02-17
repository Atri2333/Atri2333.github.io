#include<sys/types.h>
#include<sys/stat.h>
#include<fcntl.h>
#include<unistd.h>
#include<stdio.h>
#include<stdlib.h>

int main(){
    char buf[512];
    int fd;
    int nbytes;

    fd = Open("./add.c", O_RDONLY, 0);

    if((nbytes = read(fd, buf, sizeof buf)) < 0){
        printf("error! %d", nbytes);
        exit(1);
    }
    printf("%d\n", nbytes);
    printf("%s\n", buf);
    return 0;
}