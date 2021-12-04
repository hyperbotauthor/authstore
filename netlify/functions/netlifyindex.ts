import { Handler } from "@netlify/functions";

import querystring from "querystring";
import { MongoClient } from "mongodb";
const MONGODB_URI = process.env.MONGODB_URI;
const client = new MongoClient(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
import fetch from "node-fetch";
import * as fetchclient from "@publishvue/fetchclient";

const LOG_COLL_NAME = process.env.LOG_COLL_NAME || "zwjltbnngvwljrstwelv";

const FORM_FIELDS = [
  "LICHESS_TOKEN",
  "COLLECTION",
  "DOCUMENT_ID",
  "DOCUMENT",
  "ACTION",
  "MAX",
];

function doDbAction(request) {
  const db = client.db("lichessdb");

  let collName = request.account.id;

  if (request.COLLECTION) collName += "#" + request.COLLECTION;

  if (request.ACTION === "log") collName = LOG_COLL_NAME;

  const coll = db.collection(collName);

  const maxLogItems = parseInt(process.env.MAX_LOG_ITEMS || "100");

  let max = 100;

  if (request.MAX) {
    const parsedMax = parseInt(request.MAX);

    if (!isNaN(parsedMax)) {
      if (parsedMax >= 1) max = parsedMax;
    }
  }

  console.log(
    "do db action",
    FORM_FIELDS.map((field) => [field, request[field]]),
    "collection",
    collName,
    "max",
    max
  );

  return new Promise((resolve) => {
    if (request.ACTION === "set") {
      coll
        .updateOne(
          {
            _id: request.DOCUMENT_ID,
          },
          {
            $set: {
              content: request.DOCUMENT,
            },
          },
          {
            upsert: true,
          }
        )
        .then((result) => {
          resolve({
            statusCode: 200,
            body: JSON.stringify(result),
          });
        });
    } else if (request.ACTION === "countdocs") {
      coll.countDocuments().then((result) => {
        resolve({
          statusCode: 200,
          body: JSON.stringify(result),
        });
      });
    } else if (request.ACTION === "collsize") {
      coll.stats().then((result) => {
        resolve({
          statusCode: 200,
          body: JSON.stringify(result.storageSize),
        });
      });
    } else if (request.ACTION === "listcollections") {
      db.listCollections()
        .toArray()
        .then((result) => {
          resolve({
            statusCode: 200,
            body: JSON.stringify(
              result
                .map((item) => item.name.split("#"))
                .filter((parts) => parts[0] == request.account.id)
                .map((parts) => parts.join("#"))
            ),
          });
        });
    } else if (request.ACTION === "deletecollection") {
      coll.drop().then((result) => {
        resolve({
          statusCode: 200,
          body: JSON.stringify(result),
        });
      });
    } else if (request.ACTION === "bulkwrite") {
      coll.bulkWrite(JSON.parse(request.DOCUMENT)).then((result) => {
        resolve({
          statusCode: 200,
          body: JSON.stringify(result),
        });
      });
    } else if (request.ACTION === "getall") {
      coll
        .find(
          {},
          {
            _id: true,
          }
        )
        .limit(max)
        .toArray()
        .then((result) => {
          resolve({
            statusCode: 200,
            body: JSON.stringify(result),
          });
        });
    } else if (request.ACTION === "get") {
      coll
        .findOne({
          _id: request.DOCUMENT_ID,
        })
        .then((result) => {
          resolve({
            statusCode: 200,
            body: JSON.stringify(result),
          });
        });
    } else if (request.ACTION === "getmany") {
      coll
        .find({
          _id: {
            $in: request.DOCUMENT_ID.split(
              process.env.DOCUMENT_ID_SEPARATOR || ","
            ),
          },
        })
        .toArray()
        .then((result) => {
          resolve({
            statusCode: 200,
            body: JSON.stringify(result),
          });
        });
    } else if (request.ACTION === "log") {
      const docId = request.DOCUMENT_ID || "log";

      coll
        .findOne({
          _id: docId,
        })
        .then((result) => {
          let items = result ? JSON.parse(result.items) : [];

          items.unshift({
            id: request.account.id || "?",
            time: new Date().getTime(),
            info: request.DOCUMENT || "",
          });

          if (items.length > maxLogItems) {
            items = items.slice(0, maxLogItems);
          }

          coll
            .updateOne(
              {
                _id: docId,
              },
              {
                $set: {
                  items: JSON.stringify(items),
                },
              },
              {
                upsert: true,
              }
            )
            .then((result) => {
              resolve({
                statusCode: 200,
                body: JSON.stringify(items),
              });
            });
        });
    } else {
      coll
        .deleteOne({
          _id: request.DOCUMENT_ID,
        })
        .then((result) => {
          resolve({
            statusCode: 200,
            body: JSON.stringify(result),
          });
        });
    }
  });
}

function auth(request) {
  const lichessClient = new fetchclient.FetchClient(fetch, {
    apiBaseUrl: "https://lichess.org/api",
    bearer: request["LICHESS_TOKEN"],
  });

  return new Promise((resolve) => {
    lichessClient.fetchJson("account").then((account) => {
      if (account.error) {
        if (request.ACTION === "log") {
          resolve({
            statusCode: 200,
            account: { id: "" },
          });
          return;
        }

        resolve({
          statusCode: 401,
          body: JSON.stringify({
            status: "lichessnotauthorized",
          }),
        });
      } else {
        resolve({
          statusCode: 200,
          account: account,
        });
      }
    });
  });
}

function connect(request) {
  return new Promise((resolve) => {
    client.connect((err) => {
      if (err) {
        console.error("MongoDb connection failed", err);
        resolve({
          statusCode: 500,
          body: JSON.stringify({
            status: "mongodbconnecterror",
          }),
        });
      } else {
        console.log("MongoDb connected!");
        resolve({
          statusCode: 200,
          body: JSON.stringify({
            status: "ok",
            took: new Date().getTime() - request._receivedAt,
          }),
        });
      }
    });
  });
}

const handler: Handler = async (event, context) => {
  if (event.httpMethod === "POST") {
    const params = event.queryStringParameters;

    let request;
    if (params.payload === "form") {
      request = querystring.parse(event.body);
    } else {
      request = JSON.parse(event.body);
    }

    request._receivedAt = new Date().getTime();

    let authresponse = await auth(request);

    if (authresponse.statusCode !== 200) {
      return authresponse;
    }

    request.account = authresponse.account;

    let response = await connect(request);

    if (response.statusCode !== 200) return response;

    console.log("connect ok");

    const dbActionResponse = await doDbAction(request);

    return dbActionResponse;
  } else {
    return {
      statusCode: 200,
      body: "you should use a POST request",
    };
  }
};

export { handler };
