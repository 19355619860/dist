# 镜像部署（Docker -> 阿里云容器镜像服务 ACR）

步骤概览：

- 构建镜像：将 `dist/` 打包到镜像，基于 `nginx` 托管静态站点。
- 登录 ACR：使用阿里云容器镜像服务仓库地址登录 `docker`。
- 推送镜像：把镜像推到 ACR 仓库。
- 在 ECS/ACK/Serverless 等环境运行镜像。

示例命令（本地构建并推送到 ACR）：

```bash
# 在项目根目录执行（包含本仓库的 Dockerfile）
docker build -t registry.cn-<region>.aliyuncs.com/<namespace>/<repo>:<tag> .

# 登录（会提示输入密码）
docker login registry.cn-<region>.aliyuncs.com

# 推送
docker push registry.cn-<region>.aliyuncs.com/<namespace>/<repo>:<tag>

# 本地运行测试（绑定本地 8080 端口到容器 80）
docker run -p 8080:80 registry.cn-<region>.aliyuncs.com/<namespace>/<repo>:<tag>
```

阿里云使用提示：
- 如果你使用阿里云容器镜像服务（ACR），登录用户名通常是 `阿里云账号` 或者由 RAM 提供的子账号，密码为对应的访问凭证。
- 推送完成后，可在控制台创建镜像部署（ECS + Docker、容器服务 ACK、Serverless 容器等）。

需要我代为完成的内容：
- 我可以生成并运行构建/推送脚本（需你提供 ACR 仓库地址与登录凭证）；或
- 我提供详细的 PowerShell 版命令，你在本机执行。
