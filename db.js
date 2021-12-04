const { MongoClient } = require("mongodb");

const MONGODB_URI = process.env.MONGODB_URI;

const client = new MongoClient(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

client.connect().then(() => {
  console.log("connected");

  client
    .db()
    .admin()
    .listDatabases()
    .then((result) => {
      console.log(result);
      const dbNames = result.databases.map((item) => item.name);
      const totalSize = result.databases.reduce(
        (acc, item) => {
          return {
            sizeOnDisk:
              acc.sizeOnDisk + (item.name === "local" ? 0 : item.sizeOnDisk),
          };
        },
        { sizeOnDisk: 0 }
      );
      const sizeKByte = Math.floor(totalSize.sizeOnDisk / 1e3);
      console.log(
        "total size",
        sizeKByte,
        "[kB]",
        Math.round(sizeKByte / 1e3),
        "MB"
      );
      dbNames.forEach((dbName) => {
        client
          .db(dbName)
          .listCollections()
          .toArray()
          .then((result) => {
            collData = result.map((item) => ({
              name: item.name,
              size: item.options.size,
            }));
            console.log(dbName, collData);
          });
      });
    });

  setTimeout(() => {
    client.close();
  }, 3000);
});
