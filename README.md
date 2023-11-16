# WATcloud website

The [website](https://cloud.watonomous.ca) for WATcloud.

## Contributing

> [!IMPORTANT]  
> The website is deployed via an [internal monorepo](https://github.com/WATonomous/infra-config)
> (you may get a 404 if you are not a WATcloud team member), and the code is mirrored to a
> [public repo](https://github.com/WATonomous/watcloud-website). Pull requests from the public
> repo should be applied to the internal repo by a WATcloud team member.

### Getting started

1. Clone the repo
2. Install dependencies:
    ```bash
    npm install
    ```
3. Run the development server:
    ```bash
    # This line is optional if you are using the internal monorepo
    export FETCH_FIXTURES_FROM=http://cloud.watonomous.ca/fixtures
    npm run dev
    ```
