Package.describe({
  name: 'doichain:doichain-meteor-api',
  version: '0.5.19',
  summary: 'Implements the Doichain Protocoll and provides a Doichain RPC API for Doichain nodes',
  git: 'https://github.com/Doichain/meteor-api.git',
  documentation: 'README.md'
});

Package.onUse(function(api) {

    const use   = [
            'ecmascript',
            'mongo',
            'aldeed:collection2@3.0.1',
            'alanning:roles@1.2.16',
            'mdg:validated-method@1.2.0',
            'universe:i18n@1.20.1',
            'underscore@1.0.10',
            'vsivsi:job-collection@1.4.0',
            'nimble:restivus@0.8.12',
            'http@1.4.2',
            'accounts-base@1.4.3',
            'doichain:settings@0.2.17',
            'meteorhacks:async@1.0.0'
        ],
        imply = [
            'mongo'
        ];

    api.versionsFrom('1.6.1');
    api.use(use);
    api.imply(imply);

   // api.addFiles('private/version.json', 'server', { isAsset: true });
    api.mainModule('doichain-client-api.js', 'client');
    api.mainModule('doichain-server-api.js', 'server');
});


Npm.depends({
    '@babel/runtime':'7.2.0',
    'simpl-schema':'1.5.5',
    'scribe-js':'2.0.4',
    'namecoin': '0.1.4',
    'secp256k1':'3.6.1',
    'crypto-js':'3.1.9-1',
    'standard-ecies':'1.0.0',
    'bs58':'4.0.1',
    'hashids':'1.2.2',
    'eccrypto':'1.1.2',
    'crypto':'1.0.1',
    "bitcoinjs-lib":"5.1.7",
    "doichain":"0.1.12",
    'properties-reader':'2.2.0'    
});


Package.onTest(api => {
     api.use('practicalmeteor:chai@2.1.0_1');
});
