# CometAWS

[![Build Status](https://travis-ci.org/cometcult/cometaws.svg?branch=master)](https://travis-ci.org/cometcult/cometaws)
[![Dependency Status](https://david-dm.org/cometcult/cometaws.svg)](https://david-dm.org/cometcult/cometaws)
[![devDependency Status](https://david-dm.org/cometcult/cometaws/dev-status.svg)](https://david-dm.org/cometcult/cometaws#info=devDependencies)
[![Coverage Status](https://coveralls.io/repos/cometcult/cometaws/badge.svg?branch=master&service=github)](https://coveralls.io/github/cometcult/cometaws?branch=master)

__Extremely Opinionated Amazon Web Services interface with deployment using shipit__

## Quick Start

### Install Dependencies

* Install [Node.js](https://nodejs.org/download/)
* Install [Gulp](https://github.com/gulpjs/gulp/) if you intend to develop/contribute to this project

### Install cometaws

* cometaws should be installed locally to your projects so your `shipitfile.js` follows the versioning of the cometaws package.
```
sudo npm install --save cometaws
```

### Configure cometaws

* CometAWS requires you to already have AWS configuration files in place from the [aws-sdk](https://github.com/aws/aws-sdk-js) npm package
* See [shipit](https://github.com/shipitjs/shipit) for configuration and interface for defining/running tasks

Create a new `shipitfile.js` with the following content:
```js 
module.exports = function (shipit, tasks, cometaws) {
    var cometAws = new cometaws.CometAws({
        env: shipit.environment,
        region: 'eu-west-1'
    });
    var cometDeployer = new cometaws.CometDeployer(cometAws, shipit);
    
    // defines matching EC2 servers based on tags
    cometDeployer.tags = [{
        Key: 'Role',
        Value: 'cl-web'
    }];

    // use public DNS when using script outside AWS
    cometDeployer.usePrivateDns = false;

    // shipit config
    var config = {
        default: {
            workspace: '/tmp/my_project_example',
            repositoryUrl: 'git@github.com:example/example.git',
            ignores: ['.git', 'node_modules'],
            keepReleases: 4,
            deleteOnRollback: false,
            shallowClone: true
        },
        development: {
            branch: 'develop'
        },
        production: {
            branch: 'master'
        }
    };

    return cometDeployer.configureShipit(shipit, config).then( config => {
        // dynamic list of `config.servers` is now available and we can define shipit tasks
    });
```

### Running shipitfile

Use `./bin/cometshipit` to launch a shipit instance bootstrapped with `cometaws` which
will delay initialization of shipit until `cometDeployer.configureShipit(shipit, config)` is run, thus allowing
dynamic configuration of config before executing tasks.

## License

Copyright 2015 Comet Lab AS.

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
