# myagent

简单的说，myagent 是一个使用 nodejs 编写的翻墙程序，简单可配置，更集成了 chrome 插件，可以让你上手更简单。

## myagent 是如何工作的
```
      [浏览器]
    /           \
  请求         响应
    \           /
   [本地代理服务器]
    /           \
  请求         响应
    \           /
    [中转服务器]
    /           \
  请求 >>>>>>> 响应
```

myagent 本身并不具有翻墙功能，所有的翻墙功能由第三方实现，myagent 负责和