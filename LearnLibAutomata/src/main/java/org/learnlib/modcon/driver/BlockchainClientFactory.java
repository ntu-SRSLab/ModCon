package org.learnlib.modcon.driver;
import org.apache.commons.pool2.BasePooledObjectFactory;
import org.apache.commons.pool2.PooledObject;
import org.apache.commons.pool2.impl.DefaultPooledObject;
import org.apache.commons.pool2.impl.GenericObjectPool;
import org.apache.commons.pool2.impl.GenericObjectPoolConfig;
public class BlockchainClientFactory extends BasePooledObjectFactory<BlockchainClient>{
    @Override
    public BlockchainClient create() throws Exception {
        return new BlockchainClient("localhost", 50051);
    }

    @Override
    public PooledObject<BlockchainClient> wrap(BlockchainClient client) {
        return new DefaultPooledObject<BlockchainClient>(client);
    }

    @Override
    public void destroyObject(PooledObject<BlockchainClient> p) throws Exception {
        BlockchainClient client = p.getObject();
        client.shutdown();
        super.destroyObject(p);
    }
}
