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
    config;

  beforeEach(() => {
    cometAws = {
      describeInstancesWithFilters: jasmine.createSpy()
    };
    config = {
      test: {}
    };
    shipit = {
      initConfig: jasmine.createSpy()
    };

    cometDeployer = new CometDeployer(cometAws);
  });

  it('should set tags', () => {
    cometDeployer.tags = [{
        Key: 'Project',
        Value: 'wtp'
    }];
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

    it('should resolve with config used', (done) => {
      cometDeployer.tags = [{
          Key: 'Project',
          Value: 'wtp'
      }];
      shipit.environment = 'test';

      cometAws.describeInstancesWithFilters.and.callFake( () => {
        return bluebird.resolve([{
          'PublicDnsName': 'SomeDNSAddress',
          'PrivateDnsName': 'SomeInternalDNSAddress'
        }]);
      });

      cometDeployer.configureShipit(shipit, config).then( config => {
        expect(shipit.initConfig).toHaveBeenCalledWith({
          test: {
            servers: ['ubuntu@SomeInternalDNSAddress']
          }
        });
        done();
      });

    });
  });
});
