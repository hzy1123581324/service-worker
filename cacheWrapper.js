
/*
  const cacheWrapper = new CacheWrapper({
    // 给缓存起个名
    cacheName: 'resource-cache',
    // 假设缓存 1 星期之后资源过期
    expireOptions: {
      maxAgeSeconds: 7 * 24 * 60 * 60
    }
  })
*/ 

class CacheWrapper {
  constructor ({
    cacheName,
    expireOptions: {
      maxAgeSeconds
    }
  }) {
    this.cacheName = cacheName
    this.maxAgeSeconds = maxAgeSeconds
  }
  
   async getCache () {
      if (!this.cache) {
        this.cache = await caches.open(this.cacheName)
      }
      return this.cache
    }
  
    getDB () {
      if (!this.db) {
        this.db = new DB({storeName: this.cacheName})
      }
      return this.db
    }
    
    async set (request, response) {
        // 获取 db 对象
        let db = this.getDB()
        // 获取 cache 对象
        let cache = await this.getCache()
        // 同时更新本地缓存与资源所对应的过期时间
        await Promise.all([
          cache.put(request, response),
          db.setItem(request.url, Date.now() + this.maxAgeSeconds * 1000)
        ])
        // 清理过期资源，无需阻塞异步方法的执行
        this.deleteExpires()
      }
      
       async get (request) {
          // 获取 db 对象
          let db = this.getDB()
          // 获取 cache 对象
          let cache = await this.getCache()
          // 同时读取资源及其过期时间
          let [response, expireTime] = await Promise.all([
            cache.match(request),
            db.getItem(request.url)
          ])
          // 如果未超时则代表资源没过期，将读取到的资源返回
          // 如果资源过期则不返回任何内容
          if (expireTime > Date.now()) {
            return response
          }
          // 清理过期资源，无需阻塞异步方法的执行
          this.deleteExpires()
        }
        
        async deleteExpires () {
            // 获取 db 对象
            let db = this.getDB()
            // 获取 cache 对象
            let cache = await this.getCache()
            // 获取全部资源的过期信息
            let map = await db.getAll()
            if (!map) {
              return
            }
            let now = Date.now()
            // 遍历所有过期信息，并对过期资源进行清理
            for (let [url, expireTime] of map) {
              if (expireTime <= now) {
                await cache.delete(url)
              }
            }
          }
}