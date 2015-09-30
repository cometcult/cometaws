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

'use strict';

var AWSPromised = require('aws-promised'),
    bluebird = require('bluebird');

/**
 * TODO: Add error-handler on SIGINT to automatically clean
 * launched instances? process.on('SIGINT', function() {})...
 */
class CometAws {
    constructor(config) {
        this.subnetId = config.subnetId;
        this.amiImageId = config.amiImageId;
        this.ec2 = AWSPromised.ec2();
    }

    /**
     * @param {String} instanceId
     * @param {String} status
     * @return {Promise} Promise which will resolve when the status of the instance is equal to `status`
     */
    waitForInstanceStatus(instanceId, status) {
        return this.ec2.describeInstanceStatusPromised({
            'InstanceIds': [instanceId]
        }).then(function (resp) {
            var instanceStatus = resp.InstanceStatuses ? resp.InstanceStatuses[0] : null;
            if (instanceStatus && instanceStatus.InstanceState) {
                if (instanceStatus.InstanceState.Name === 'running') {
                    return true;
                }
            }
            return bluebird.delay(3000).then(function () {
                return this.waitForInstanceStatus(instanceId, status);
            }.bind(this));
        }.bind(this));
    }

    /**
     * @param {Array} filters
     * @return {Promise}
     */
    describeInstancesWithFilters(filters) {
        return this.ec2.describeInstancesPromised({
            Filters: filters
        }).then(function (response) {
            return response.Reservations.map( reservation => reservation.Instances[0] );
        });
    }

    /**
     * @param {Object} instanceParams (instanceType, hostname, instanceParams, securityGropIds, userData)
     */
    launchInstance(instanceParams) {
        // get Instance ID = response.Instances[0].InstanceId;
        
        var instanceOptions = {
            'InstanceType': instanceParams.instanceType,
            'SubnetId': this.subnetId,
            'SecurityGroupIds': instanceParams.securityGroupIds,
            'KeyName': 'puppets',
            'UserData': instanceParams.userData ? instanceParams.userData : null,
            'ImageId': this.amiImageId,
            'MinCount': 1,
            'MaxCount': 1,
            'DryRun': false,
            'BlockDeviceMappings': [
                {
                    'DeviceName': '/dev/sda1',
                    'Ebs': {
                        'VolumeSize': parseInt(instanceParams.disksize, 10)
                    }
                }
            ]
        };

        return this.ec2.runInstancesPromised(instanceOptions);
    }

    terminateInstance(instanceId) {
        return this.ec2.terminateInstancesPromised({
            instanceId: instanceId
        });
    }

    /**
     * tagInstance with a set of tags
     *
     * @param {String} instanceId
     * @param {Array} tags @see CometAws.createTag(key, val)
     */
    tagInstance(instanceId, tags) {
        return this.ec2.createTagsPromised({
            'Resources': [instanceId],
            'Tags': tags
        });
    }

    /**
     * @param {Object} instance Instance object as returned from AWS
     */
    static getPublicDnsNameForInstance(instance) {
        return instance.PublicDnsName;
    }

    static getPrivateDnsNameForInstance(instance) {
        return instance.PrivateDnsName;
    }

    static createTagFilter(key, value) {
        return {
            Name: `tag:${key}`,
            Values: [value]
        };
    }

    static createNameTag(name) {
        return CometAws.createTag('Name', name);
    }

    static createTag(key, value) {
        return {
            Key: key,
            Value: value
        };
    }
}

module.exports = CometAws;