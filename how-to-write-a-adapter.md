# how to write a adapter
myagent 被设计为可以使用多个 adapter，只要有能翻墙的 adapter，myagent 就一直能够正常工作，下面说说如何写一个 adapter。

## adapter 是什么
adapter 是一个 nodejs 模块，它描述了如何访问中转服务器。adapter 有两种形式：一种是 JSON ，一种是 JS 。

当使用 JSON 形式的时候，只需要配置中转服务器的一些必要信息就可以了。
当使用 JS 形式的时候，怎么做就看你了。
## adapter 格式
简单的说，实现一个 adapter 只需要两个函数：

* requestHandler
* connectHandler

这两个函数的说明放在后面，先来看没有这两个函数的情况。如果一个 adapter 没有提供这两个函数，将自动使用默认实现。默认实现需要这些参数：
```json
{
    "gfwProtected": true, // 要翻墙为 true，否则 false
    "server": { // 中转服务器接收 POST 数据的接口信息
        "protocol": "https:",
        "port": 443,
        "host": "tonicdev.io",
        "path": "/aaronzhang/570140c376f90a11000927ab/branches/master",
        "method": "POST"
    }
}
```
注意：目前的实现严格按照上述格式，请不要增加无用字段。如果你自己部署了 `/transserver/remoteserver.js` ，则需要根据你自己的部署情况来填写上面的信息。很简单的吧？

### requestHandler
当浏览器发送 GET 代理请求的时候，调用此函数，这种情况一般是访问 http 类型的网站。这时候要重新发起一个到中转服务器的 POST 请求，之所以是 POST 请求，是因为 GET 不支持请求体。更多可以参考：`/adapters/direct.js`
### connectHandler
当浏览器发送 CONNECT 代理请求的时候，调用此函数，这种情况一般是访问 https 类型的网站。这时候也需要重新发起一个到中转服务器的 POST 请求。更多可以参考：`/adapters/index.js` 里面的 `defaultConnectHandler` 函数。
