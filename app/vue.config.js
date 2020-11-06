module.exports = {
    devServer: {
      host: "0.0.0.0",
      public: process.env.IP+"/modcon",
      port: 8080,
      https: false,
      hotOnly: false,
      disableHostCheck:true,
    }
  };