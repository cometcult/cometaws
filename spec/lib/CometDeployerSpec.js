// Copyright 2015 Comet Lab AS.

// Permission to use, copy, modify, and/or distribute this software for any 
// purpose with or without fee is hereby granted, provided that the above 
// copyright notice and this permission notice appear in all copies.

// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
// WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF 
// MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR 
// ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES 
// WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION
//  OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN 
// CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

describe('CometDeployer', () => {
  var CometDeployer = require('../../lib/CometDeployer'),
    bluebird = require('bluebird'),
    cometDeployer,
    cometAws,
    shipit,
    config,
    shipitConfig;

  beforeEach(() => {
    cometAws = {
      describeInstancesWithFilters: jasmine.createSpy()
    };
    config = {
      test: {}
    };
    shipitConfig = {
      default: {}
    };
    shipit = {
      initConfig: jasmine.createSpy(),
      on: jasmine.createSpy()
    };

    cometDeployer = new CometDeployer(cometAws);
  });

  it('should initialize with default values', () => {
    expect(cometDeployer.sshUsername).toEqual('ubuntu');
  });

  it('should set tags', () => {
    cometDeployer.tags = [{
        Key: 'Project',
        Value: 'wtp'
    }];
  });

  describe('fail during errors', function () {
    // Needed until https://github.com/shipitjs/shipit/commit/e99fe2da270aecd548e5c18b1ba8a4023ba703d3 is tagged in a release
    beforeAll( () => {
      this.originalExit = process.exit;
      process.exit = jasmine.createSpy();
    });

    it('should configure error handler', function () {
      cometDeployer.injectErrorHandler(shipit);
      expect(shipit.on).toHaveBeenCalledWith('task_error', cometDeployer.exitWithError);
    });

    it('should exit on error event', function () {
      cometDeployer.exitWithError();
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    afterAll( () => {
      process.exit = this.originalExit;
    });

  });

  describe('should configure shipit', () => {

    it('should throw exception on missing env', () => {
      cometDeployer.tags = [];
      expect(function () {
        cometDeployer.configureShipit(shipit, config);
      }).toThrowError('No environment set');  
    });
    it('should throw exception on missing tags', () => {
      shipit.environment = 'test';
      expect(function () {
        cometDeployer.configureShipit(shipit, config);
      }).toThrowError('No AWS tags set');  
    });

    it('should throw exception if no matching instances were found', (done) => {
      cometDeployer.tags = [{
          Key: 'Project',
          Value: 'wtp'
      }];
      shipit.environment = 'test';

      cometAws.describeInstancesWithFilters.and.callFake( () => {
        return bluebird.resolve([]);
      });
      cometDeployer.configureShipit(shipit, config).catch( (err) => {
        expect(err).toEqual(jasmine.any(Error));
        expect(shipit.initConfig).not.toHaveBeenCalled();
        done();
      });
    });
    
    describe('supporting both private and public dns', () => {
      beforeEach(() => {
        cometDeployer.tags = [{
            Key: 'Project',
            Value: 'wtp'
        }];
        cometDeployer.sshUsername = 'someuser';
        shipit.environment = 'test';

        cometAws.describeInstancesWithFilters.and.callFake( () => {
          return bluebird.resolve([{
            'PublicDnsName': 'SomeDNSAddress',
            'PrivateDnsName': 'SomeInternalDNSAddress'
          }]);
        });
        shipit.initConfig.and.callFake(() => {
          shipit.config = shipitConfig;
        });
      });

      it('should configure with matching aws instances', (done) => {
        cometDeployer.configureShipit(shipit, config).then( (config) => {
          expect(shipit.initConfig).toHaveBeenCalledWith({
            test: {
              servers: ['someuser@SomeInternalDNSAddress']
            }
          });
          expect(config).toEqual(shipitConfig);
          done();
        });
      });

      it('should configure with matching aws instances using public DNS address', (done) => {
        cometDeployer.usePrivateDns = false;

        cometDeployer.configureShipit(shipit, config).then( (config) => {
          expect(shipit.initConfig).toHaveBeenCalledWith({
            test: {
              servers: ['someuser@SomeDNSAddress']
            }
          });
          expect(config).toEqual(shipitConfig);
          done();
        });
      });
    });
  });
});
