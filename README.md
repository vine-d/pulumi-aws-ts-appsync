# Very simple PULUMI GraphQL + DynamoDB deploy

    Set up a basic GraphQL endpoint in AWS AppSync.
    The endpoint contains one query and one mutation that get and put items to a Dynamo DB table.
    Main used reference: https://github.com/pulumi/examples/tree/master/aws-ts-appsync

## Requirements

-   aws-cli
-   pulumi

## Deploying and running the Pulumi App

1.  Create a new stack:

    ```bash
    $ pulumi stack init dev
    ```

1.  Set the AWS region:

    ```
    $ pulumi config set aws:region us-east-2
    ```

1.  Restore NPM modules via `yarn install`.

1.  Run `pulumi up` to preview and deploy changes:

    ``` 
    $ pulumi up
    Previewing update (dev):
    ...

    Updating (dev):
    ...
    Resources:
        + # created
    Duration: ##s
    ```

1.  Use the outputs `endpoint` and `key` ('x-api-key' HEADER) to test GraphQL example calls:

    QUERY
    ```
    query GetUser {
        getUserById(id: "123") {
            id
            name
        }
    }
    ```
    MUTATION
    ```
    mutation AddUser {
        addUser(id: "123", name: "SamCaioNatasha") {
            id
            name
        }
    }
    ```

## CLEANING UP

1. `pulumi destroy` - to tear down all resources.
1. `pulumi stack rm` - delete the stack itself (Note that this command deletes all deployment history from the Pulumi Console)