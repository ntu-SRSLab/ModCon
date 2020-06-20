/*
 * NB: since truffle-hdwallet-provider 0.0.5 you must wrap HDWallet providers in a 
 * function when declaring them. Failure to do so will cause commands to hang. ex:
 * ```
 * mainnet: {
 *     provider: function() { 
 *       return new HDWalletProvider(mnemonic, 'https://mainnet.infura.io/<infura-key>') 
 *     },
 *     network_id: '1',
 *     gas: 4500000,
 *     gasPrice: 10000000000,
 *   },
 */
module.exports = {
    // See <http://truffleframework.com/docs/advanced/configuration>
    // to customize your Truffle configuration!
    /// 172.21.176.77
    //172.18.0.1
    networks: {
        development: {
            host: "127.0.0.1",
            port: 8545,
            network_id: "*"
        },
        fuzz: {
            host: "172.18.0.1",
            port: 8545,
            network_id: "1900",
            from: "0x2B71cc952C8e3dFe97A696CF5C5b29F8a07dE3D8"
        },
        SCFuzzer: {
            host: "localhost",
            port: 8566,
            network_id: "*",
            from: "0x0674b8a1ec98296257405065658f1bb7a68553e2"
        }
    },

    compilers: {
        solc: {
            version: "^0.4.24" // A version or constraint - Ex. "^0.5.0"
            // Can also be set to "native" to use a native solc
        }
    }
};
