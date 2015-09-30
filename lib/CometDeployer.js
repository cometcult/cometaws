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

const CometAws = require('./CometAws');

class CometDeployer {
    
    constructor(cometAws, shipit) {
        this.cometAws = cometAws;
        this.shipit = shipit;
        this.usePrivateDns = true;
    }

    get tagFilters() {
        return this.tags.map( tag => CometAws.createTagFilter(tag.Key, tag.Value) );
    }

    configureShipit(shipit, config) {
        if (!this.tags) {
            throw new Error('No AWS tags set');
        }
        if (!shipit.environment) {
            throw new Error('No environment set');
        }

        return this.cometAws.describeInstancesWithFilters(this.tagFilters).then( instances => {
            return instances.map( instance => {
                if (this.usePrivateDns) {
                    return `ubuntu@${CometAws.getPrivateDnsNameForInstance(instance)}`;
                } else {
                    return `ubuntu@${CometAws.getPublicDnsNameForInstance(instance)}`;
                }
            }).filter(function (dnsName) {
                return dnsName;
            });
        }).then( instanceDnsNames => {
            if (!instanceDnsNames.length) {
                throw new Error('No matching AWS instances for filters: ' + JSON.stringify(this.tagFilters, null, 2));
            }
            config[shipit.environment].servers = instanceDnsNames;
            
            shipit.initConfig(config);

            return shipit.config;
        });
    }
}

module.exports = CometDeployer;