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

describe('CometAws', () => {
  var CometAws = require('../../lib/CometAws'),
    bluebird = require('bluebird'),
    cometAws,
    ec2;

  beforeEach(() => {
    cometAws = new CometAws({
      env: 'development'
    });
    ec2 = {
      terminateInstancesPromised: jasmine.createSpy(),
      describeInstanceStatusPromised: jasmine.createSpy(),
      createTagsPromised: jasmine.createSpy()
    };
    cometAws.ec2 = ec2;
  });

  it('should notify when instance reaches a given state', done => {
    var calledCount = 0;

    ec2.describeInstanceStatusPromised.and.callFake( () => {
      return bluebird.resolve({
        InstanceStatuses: [{
          InstanceState: {
            Name: calledCount++ < 1 ? 'launching' : 'running'
          }
        }]
      });
    });

    cometAws.waitForInstanceStatus('someid', 'running').then(response => {
      expect(ec2.describeInstanceStatusPromised).toHaveBeenCalledWith({
        'InstanceIds': ['someid']
      });
      expect(calledCount).toEqual(2);
      expect(response).toBeTruthy();
      done();
    }).catch(err => done.fail(err));
  });

  it('should terminate instance', () => {
    cometAws.terminateInstance('someid');
    expect(ec2.terminateInstancesPromised).toHaveBeenCalledWith({
      instanceId: 'someid'
    });
  });

  it('should create tag filters', () => {
    expect(CometAws.createTagFilter('Project', 'Confr')).toEqual({
      Name: 'tag:Project',
      Values: ['Confr']
    });
  });

  it('should create tag', () => {
    expect(CometAws.createTag('SomeKey', 'WithSomeValue')).toEqual({
      Key: 'SomeKey',
      Value: 'WithSomeValue'
    });
  });

  it('should create name tag', () => {
    expect(CometAws.createNameTag('InstanceName')).toEqual({
      Key: 'Name',
      Value: 'InstanceName'
    });
  });

  it('should tag instace', () => {
    var tags = [{
      Key: 'Name',
      Value: 'SomeValue'
    }, {
      Key: 'Environment',
      Value: 'Development'
    }];

    cometAws.tagInstance('someid', tags);

    expect(ec2.createTagsPromised).toHaveBeenCalledWith({
        'Resources': ['someid'],
        'Tags': tags
    });
  });
});
