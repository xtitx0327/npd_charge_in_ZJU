# ZJU 小龟充电助手

这是微信小程序**小龟充电助手**的后端代码，基于 Flask 框架开发. 其前身是一个原生 H5 应用，源码依 Flask 规范存放在 `/static` 和 `/templates` 目录下，现已弃用.

## 安装与运行

克隆仓库后，请先执行以下命令安装必要的依赖：

```
pip install -r requirements.txt
```

然后将 `config.template.json` 改名为 `config.json`，并修改所有必要的配置：

```
mv config.template.json config.json
```

其中，OpenID 和 UnionID 为你在公众号**尼普顿智慧生活**下的用户 ID，可以通过抓包获取. 配置完成后，通过以下命令启动服务：

```
nohup python3 main.py &
```

## 补充说明

本程序仅供教育目的，不用于商业用途.
