import * as aws from "@pulumi/aws";
import * as random from "@pulumi/random";
import { createIamRole } from "./iam";

// Dynamo DB table to hold data for the GraphQL endpoint
const table = new aws.dynamodb.Table("users", {
    hashKey: "id",
    attributes: [{ name: "id", type: "S" }],
    readCapacity: 1,
    writeCapacity: 1,
});

// Create IAM role and policy wiring
const role = createIamRole("iam", table);

// GraphQL Schema
const schema =
    `type Query {
        getUserById(id: ID!): User
    }
    type Mutation {
        addUser(id: ID!, name: String!): User!
    }
    type User {
        id: ID!
        name: String
    }
    schema {
        query: Query
        mutation: Mutation
    }`;

// Create API accessible with a key
const api = new aws.appsync.GraphQLApi("api", {
    authenticationType: "API_KEY",
    schema,
});
const apiKey = new aws.appsync.ApiKey("key", {
    apiId: api.id,
});

const randomString = new random.RandomString("random-datasource-name", {
    length: 15,
    special: false,
    number: false,
});

// Link a data source to the Dynamo DB Table
const dataSource = new aws.appsync.DataSource("users-ds", {
    name: randomString.result,
    apiId: api.id,
    type: "AMAZON_DYNAMODB",
    dynamodbConfig: {
        tableName: table.name,
    },
    serviceRoleArn: role.arn,
});

// A resolver for the [getUserById] query
const getResolver = new aws.appsync.Resolver("get-resolver", {
    apiId: api.id,
    dataSource: dataSource.name,
    type: "Query",
    field: "getUserById",
    requestTemplate: `{
        "version": "2017-02-28",
        "operation": "GetItem",
        "key": {
            "id": $util.dynamodb.toDynamoDBJson($ctx.args.id),
        }
    }`,
    responseTemplate: `$util.toJson($ctx.result)`,
});

// A resolver for the [addUser] mutation
const addResolver = new aws.appsync.Resolver("add-resolver", {
    apiId: api.id,
    dataSource: dataSource.name,
    type: "Mutation",
    field: "addUser",
    requestTemplate: `{
        "version" : "2017-02-28",
        "operation" : "PutItem",
        "key" : {
            "id" : $util.dynamodb.toDynamoDBJson($ctx.args.id)
        },
        "attributeValues" : {
            "name": $util.dynamodb.toDynamoDBJson($ctx.args.name)
        }
    }`,
    responseTemplate: `$util.toJson($ctx.result)`,
});

export const endpoint = api.uris["GRAPHQL"];
export const key = apiKey.key;