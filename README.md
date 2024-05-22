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
    pip install -r requirements.txt
    npm install
    ```
3. Run the development server:
    ```bash
    # This line is optional if you are using the internal monorepo
    export FETCH_FIXTURES_FROM=http://cloud.watonomous.ca/fixtures
    npm run dev
    ```

### Image optimization

Images should be added to `public/assets`. To reduce the size of the code base while we work on an image server, images should be optimized before being checked in. To do this, run:

```bash
./node_modules/.bin/optimizt <path_to_image> --avif
```

this will create a `.avif` file next to the original image. Place the optimized image in `public/assets`.

During the build process, the `.avif` file will be converted to a `.webp` file and a `.jpg` file, a Typescript file will be generated to
statically import the images. In the code, images should be used like this:

```tsx
import Picture from '@/components/picture'
import { ComputerDark } from '@/build/fixtures/images'

<Picture alt="Abstract Computer (Dark)" image={ComputerDark} />
```

The Picture component will tell the browser to automatically choose the best image format for the user's device.
