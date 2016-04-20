# myagent

简单的说，myagent 是一个使用 nodejs 编写的翻墙程序，简单可配置，更集成了 chrome 插件，可以让你上手更简单。

## myagent 是否适合我
如果你有现成的高速 VPN，有跑着 ShadowSocks 的翻墙主机，那么你来错地方了。

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

myagent 本身并不具有翻墙功能，所有的翻墙功能由中转服务器实现，myagent 负责和中转服务器交换浏览器端的数据。举个栗子说明这个过程：

在浏览器地址栏输入 www.google.com ，由于设置了代理，浏览器把请求发送给代理服务器，代理服务器发起一个到中转服务器的新请求，中转服务器收到请求后又发起一个到 www.google.com 的请求，Google 服务器返回后，中转服务器把数据交给代理服务器，代理服务器则又把数据交给浏览器。

### 为什么不直接把请求发给 中转服务器？
说到这个问题，其实就需要说清楚 myagent 适用的地方了。正如上面所说，需要使用 myagent 的人绝不是有现成高速 VPN 或者 ShadowSocks 在手的土豪。既然不走土豪的路子，只能在 GFW 的打击下另谋出路了。

myagent 使用了[tonicdev](https://tonicdev.com/) 作为翻墙媒介，tonicdev 是什么？这是一个可以在线执行 nodejs 代码，并且可以将一段 nodejs 代码保存为一个 http API 的良心网站。不是很明白？我稍微具体的描述下这个过程：
首先，在这个网站上写一段代码，比如：
```javascript
exports.tonicEndpoint = function(){
    return "hello, myagent";
};
```
然后网站给我这段代码分配了一个地址，假如是这样：
```plain
http://tonicdev.com/aaronzhang/570140c376f90a11ca0927ab/branches/master
```
这样，当我访问这个地址的时候，我就会得到：`hello, myagent`

myagent 正是借助了 tonicdev 这种导出为 API 功能，并将其作为中转服务器，实现了翻墙功能。

### 翻墙效果如何？
经过我两周的使用，一般般吧，不是那种可以秒开的速度，只能说在正常忍受范围之内。
### 如果 tonicdev 挂了怎么办？
如果 tonicdev 挂了就意味着这个翻墙工具失败了，我们又需要另谋出路了。但是 myagent 本身设计为可以使用多种翻墙方式，如果你可以找到类似 tonicdev.com 的替代网站，可以告诉我，我会尽力写一个新的适配器让 myagent 重新恢复活力。如果你有可翻墙远程主机，并且对 shadowsocks 不熟或者嫌麻烦，也可以在远程主机上部署 `/transserver/remoteserver.js` ，并且仿照 `/adapters/tonicdev.json` 写一个适配器，也可以达到翻墙的目的。更多可以参考：[how-to-write-a-adapter.md](./how-to-write-a-adapter.md)。
### 安装/运行/配置本地代理服务器
myagent 没有使用任何第三方模块，全部自己实现，所以你不需要安装依赖。
克隆或者下载 myagent 后，在主目录执行：
```bash
node myagent.js
```
这样，myagent 就跑起来了。

myagent 不是自动翻墙的，你必须告诉它访问哪些域名的时候需要翻墙，项目已经内置了一些域名，你可以根据自己的需要增删，域名配置文件在：`/hosts`。
### 浏览器插件
目前只支持 chrome 浏览器插件，插件的位置在：`/browser_plugin/chrome`。

你可以使用下面的步骤安装它：
* 打开 chrome 浏览器，点击菜单后选择“设置”
* 在设置页面的左上角点击“扩展程序”
* 选中右上角的“开发者模式”复选框
* 点击“加载已解压的扩展程序”按钮，选择 `/browser_plugin/chrome` 文件夹
* 点击插件图标，设置代理服务器的IP，端口信息
* 大功告成

目前的插件只实现了基本功能，也没有做任何美化。

## 配置 myagent
你可以在 `config.json` 里面配置 myagent 的一些选项，下面是选项说明：

* `debug` 是否开启调试模式
* `host` 本地服务器绑定的主机
* `port` 本地服务器绑定的端口号
* `default_adapter` 当请求的主机不在 hosts 里面的时候，使用此 adapter

## 说明
为了方便大家，项目直接内置了我的 tonicdev API，确保大家下载后可直接翻墙。但是，从长久来说，我还是建议大家自己去 tonicdev.com 注册一个账号并新建一个 notebook，将 `/transserver/remoteserver.js` 的内容复制进去，然后使用自己的 notebook 地址替换 `/adapters/tonicdev.json` 中的 path。这样官方应该不会太注意到我。
