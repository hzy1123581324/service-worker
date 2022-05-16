const router = new Router()
// 实例化 cacheWrapper 对象
const cacheWrapper = new CacheWrapper({
  // 单独给图片资源分配缓存名称
  cacheName: 'image-cache',
  expireOptions: {
    // 对图片资源缓存 1 星期
    maxAgeSeconds: 7 * 24 * 60 * 60
  }
})
router.registerRoute(/\.(jpe?g|png)$/, async request => {
  // 优先读取本地缓存中的图片
  // 如果本地无缓存图片/缓存过期/读取缓存出错，则 response 为空
  let response = await cacheWrapper.get(request).catch(() => {})
  if (response) {
    return response
  }
  // 如果本地尚未缓存或者缓存过期，则发起网络请求获取最新图片资源
  response = await fetch(request.clone())
  // 如果请求成功，则更新缓存
  // 更新缓存过程无需阻塞进程
  if (response.ok) {
    cacheWrapper.set(request, response.clone())
  }
  // 返回资源
  return response
})