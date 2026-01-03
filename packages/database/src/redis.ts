if (typeof Bun == undefined && !Bun.redis) {
  throw new Error("please use (BUN) enviermoent");
}

const url = process.env.REDIS_URL!;
let redis = new Bun.RedisClient(url);

export default redis;
