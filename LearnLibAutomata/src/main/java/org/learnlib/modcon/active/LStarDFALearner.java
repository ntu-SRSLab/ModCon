package org.learnlib.modcon.active;

import com.google.common.annotations.VisibleForTesting;
import com.google.common.collect.Iterators;
import com.google.common.collect.Streams;
import de.learnlib.algorithms.lstar.dfa.ClassicLStarDFA;
import de.learnlib.algorithms.lstar.dfa.ClassicLStarDFABuilder;
import de.learnlib.algorithms.lstar.mealy.ExtensibleLStarMealy;
import de.learnlib.algorithms.lstar.mealy.ExtensibleLStarMealyBuilder;
import de.learnlib.api.SUL;
import de.learnlib.api.algorithm.LearningAlgorithm;
import de.learnlib.api.oracle.EquivalenceOracle;
import de.learnlib.api.oracle.MembershipOracle;
import de.learnlib.api.oracle.parallelism.ThreadPool;
import de.learnlib.api.query.DefaultQuery;
import de.learnlib.api.query.Query;
import de.learnlib.api.statistic.StatisticSUL;
import de.learnlib.datastructure.observationtable.OTUtils;
import de.learnlib.datastructure.observationtable.writer.ObservationTableASCIIWriter;
import de.learnlib.drivers.reflect.MethodInput;
import de.learnlib.drivers.reflect.MethodOutput;
import de.learnlib.drivers.reflect.SimplePOJOTestDriver;
import de.learnlib.filter.cache.dfa.DFACacheOracle;
import de.learnlib.filter.cache.dfa.DFACaches;
import de.learnlib.filter.cache.sul.SULCaches;
import de.learnlib.filter.reuse.ReuseCapableOracle;
import de.learnlib.filter.reuse.ReuseOracle;
import de.learnlib.filter.statistic.oracle.DFACounterOracle;
import de.learnlib.filter.statistic.sul.ResetCounterSUL;
import de.learnlib.oracle.equivalence.DFAWMethodEQOracle;
import de.learnlib.oracle.equivalence.*;
import de.learnlib.oracle.equivalence.mealy.RandomWalkEQOracle;
import de.learnlib.oracle.membership.SULOracle;

import de.learnlib.oracle.parallelism.*;
import de.learnlib.oracle.parallelism.DynamicParallelOracle;
import de.learnlib.oracle.parallelism.DynamicParallelOracleBuilder;
import de.learnlib.util.Experiment;
import de.learnlib.util.statistics.SimpleProfiler;
import net.automatalib.automata.UniversalDeterministicAutomaton;
import net.automatalib.automata.fsa.DFA;
import net.automatalib.automata.transducers.MealyMachine;
import net.automatalib.serialization.dot.GraphDOT;
import net.automatalib.visualization.Visualization;
import net.automatalib.words.Alphabet;
import net.automatalib.words.Word;
import net.automatalib.words.WordBuilder;
import net.automatalib.words.impl.GrowingMapAlphabet;
import org.checkerframework.checker.nullness.qual.Nullable;
import net.automatalib.automata.concepts.Output;

import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.lang.reflect.Method;
import java.util.*;
import java.util.function.Supplier;

import org.apache.commons.pool2.BasePooledObjectFactory;
import org.apache.commons.pool2.PooledObject;
import org.apache.commons.pool2.impl.DefaultPooledObject;
import org.apache.commons.pool2.impl.GenericObjectPool;
import org.apache.commons.pool2.impl.GenericObjectPoolConfig;

import org.learnlib.modcon.driver.BlockchainClient;
import org.learnlib.modcon.driver.BlockchainClientFactory;
import org.learnlib.modcon.modelchecker.ModelChecker;
import org.learnlib.modcon.util.ABIPredicate;
import org.learnlib.modcon.util.Reader;

import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.stream.Stream;

public class LStarDFALearner implements ActiveDFALearner {
    private static final String RANDOMWORDS = "RandomWords";
    private static final String WMETHOD = "WMethod";
    private static final String WpMETHOD = "WpMethod";
    private static final String RANDOMWMETHOD = "RandomWMethod";
    private static final String RANDOMWpMETHOD = "RandomWpMethod";
    private static final Boolean DEBUG = true;
    private static final Boolean IsValuePredicate = true;
    private static final Boolean IsHandleInputs = false;

    private static final Boolean isMealyMachine = false;

    private static final Logger logger = Logger.getLogger(BlockchainClient.class.getName());
    private static int LOOK_AHEAD = 1;

    private static final int RANDOM_LEN = 7;
    private static final int MINI_SZ = 1;
    private static final int BOUND = 50;

    // RandomWords Setting
    private static int MIN_LEN = 1;
    private static int MAX_LEN = 7;
    private static int MAX_TESTS = 200;

    private static final String RESET = "Create";

    private static final String OFFER_1 = "offer_1";
    private static final String OFFER_2 = "offer_2";
    private static final String POLL = "poll";

    private final Alphabet<String> inputs;
    private final List<Word<String>> initialSuffixes;
    private Reader reader;
    private Date start;

    private GenericObjectPoolConfig poolConfig;
    private GenericObjectPool<BlockchainClient> objectPool;

    private BlockchainClient client;
    private ModelChecker checker;

    public LStarDFALearner() {
        checker = new ModelChecker();
        reader = new Reader("/home/liuye/Projects/ModCon/data/learn.txt");
        reader.readExamples();
        List<String> methods = reader.getMethods();
        inputs = new GrowingMapAlphabet<>();
        for (String method : methods) {
            if (IsHandleInputs) {
                String[] strs = { "Complete", "TransferResponsibility", "IngestTelemetry 10=<a<=80,0=<b<=100",
                        "IngestTelemetry 0=<a<10,0=<b<=100", "IngestTelemetry a>80,0=<b<=100" };
                for (String str : strs) {
                    inputs.add(str);
                }
            } else if (IsValuePredicate) {
                // inputs.addAll(ABIPredicate.insertValuePredicate(reader.getFullNameFunction(method),9));
                inputs.addAll(ABIPredicate.insertValuePredicate(reader.getFullNameFunction(method), 0, 10));
            } else {
                inputs.add(method);
            }
        }
        System.out.println(inputs);

        initialSuffixes = new ArrayList<>();
        for (String symbol : inputs) {
            initialSuffixes.add(Word.fromLetter(symbol));
        }
        /** 连接池的配置 */
        poolConfig = new GenericObjectPoolConfig();
        /** 下面的配置均为默认配置,默认配置的参数可以在BaseObjectPoolConfig中找到 */
        poolConfig.setMaxTotal(64); // 池中的最大连接数
        poolConfig.setMinIdle(0); // 最少的空闲连接数
        poolConfig.setMaxIdle(64); // 最多的空闲连接数
        poolConfig.setMaxWaitMillis(-1); // 当连接池资源耗尽时,调用者最大阻塞的时间,超时时抛出异常 单位:毫秒数
        poolConfig.setLifo(true); // 连接池存放池化对象方式,true放在空闲队列最前面,false放在空闲队列最后
        poolConfig.setMinEvictableIdleTimeMillis(1000L * 60L * 30L * 100); // 连接空闲的最小时间,达到此值后空闲连接可能会被移除,默认即为30分钟*100
        poolConfig.setBlockWhenExhausted(true); // 连接耗尽时是否阻塞,默认为true

        objectPool = new GenericObjectPool<BlockchainClient>(new BlockchainClientFactory(), poolConfig);

        client = BlockchainClient.getDefaultInstance();
    }

    @Override
    public void setAlphabets() {

    }

    public static void main(String[] args) throws NoSuchMethodException, IOException {
        LStarDFALearner lstar = new LStarDFALearner();
        List<String> methods = new ArrayList<>();
        // methods.add(RANDOMWORDS);
        methods.add(WpMETHOD);
        // methods.add(WMETHOD);
        for (String method : methods) {
            logger.info(method);
            if (method == RANDOMWORDS) {
                // MIN_LEN: 1 fixed.
                // MAX_LEN from 6-8, Max_Tests from 100-400
                for (MAX_LEN = 5; MAX_LEN < LENGTH_QUERY; MAX_LEN++) {
                    for (MAX_TESTS = 100; MAX_TESTS < 400; MAX_TESTS = MAX_TESTS + 100) {
                        logger.info(method + " -> min_len: " + MIN_LEN + ", max_len: " + MAX_LEN + ", max_tests: "
                                + MAX_TESTS);
                        QueryCount = 0;
                        if (!isMealyMachine) {
                            lstar.learn(method);
                            logger.info("QueryCount: " + QueryCount);
                        } else {
                            lstar.refineUseMealyMachine(null, method);
                            logger.info("Mealy QueryCount: " + QueryCount);
                        }
                    }
                }
            } else {
                for (LOOK_AHEAD = 1; LOOK_AHEAD < 2; LOOK_AHEAD++) {
                    QueryCount = 0;
                    if (!isMealyMachine) {
                        lstar.learn(method);
                        logger.info("DFA QueryCount: " + QueryCount);
                    } else {
                        lstar.refineUseMealyMachine(null, method);
                        logger.info("Mealy QueryCount: " + QueryCount);
                    }
                }
            }
        }
    }

    public DFA<?, String> learn(String eqTestMethod) throws IOException {
        start = new Date();
        /**
         * create dfa mqOracle without cache support
         */
        MembershipOracle.DFAMembershipOracle<String> mqCacheOracle = DFACaches.createCache(inputs,
                new FullDFAMembershipQueryOracle());
        /**
         * create dfa mqOracle with cache support and parallel support
         */
        Supplier<MembershipOracle.DFAMembershipOracle<String>> supplier = () -> new FullDFAMembershipQueryOracle();
        DynamicParallelOracleBuilder<String, Boolean> builder = new DynamicParallelOracleBuilder(supplier);

        MembershipOracle<String, Boolean> mqOracle = builder.withPoolSize(32).create();

        // construct L* instance./.
        ClassicLStarDFA<String> lstar = new ClassicLStarDFABuilder<String>().withAlphabet(inputs) // input alphabet
                .withOracle(mqOracle) // membership oracle
                .create();

        // construct a learning experiment from
        // the learning algorithm and the conformance test.
        // The experiment will execute the main loop of active learning
        Experiment.DFAExperiment<String> experiment = null;
        switch (eqTestMethod) {
            case WMETHOD: {
                logger.info("this is " + WMETHOD);
                experiment = new Experiment.DFAExperiment<>(lstar, new IncreDFAWMethodEQOracle<>(mqOracle, LOOK_AHEAD),
                        inputs);
                break;
            }
            case WpMETHOD: {
                logger.info("this is " + WpMETHOD);
                experiment = new Experiment.DFAExperiment<>(lstar, new IncreDFAWpMethodEQOracle<>(mqOracle, LOOK_AHEAD),
                        inputs);
                break;
            }
            case RANDOMWMETHOD: {
                logger.info("this is " + RANDOMWMETHOD);
                experiment = new Experiment.DFAExperiment<>(lstar,
                        new RandomWMethodEQOracle<>(mqOracle, MINI_SZ, RANDOM_LEN, BOUND), inputs);
                break;
            }
            case RANDOMWpMETHOD: {
                logger.info("this is " + RANDOMWpMETHOD);
                experiment = new Experiment.DFAExperiment<>(lstar,
                        new RandomWpMethodEQOracle<>(mqOracle, MINI_SZ, RANDOM_LEN, BOUND), inputs);
                break;
            }
            case RANDOMWORDS: {
                logger.info("this is " + RANDOMWORDS);
                experiment = new Experiment.DFAExperiment<>(lstar,
                        new IncreDFARandomWordsEQOracle<>(mqOracle, MIN_LEN, MAX_LEN, MAX_TESTS), inputs);
                break;
            }
            default: {
                experiment = new Experiment.DFAExperiment<>(lstar, new WMethodEQOracle<>(mqOracle, LOOK_AHEAD), inputs);
            }
        }

        // turn on time profiling
        experiment.setProfile(true);

        // enable logging of models
        experiment.setLogModels(true);

        // run experiment
        experiment.run();

        // get learned model
        DFA<?, String> result = experiment.getFinalHypothesis();

        // report results
        logger.log(Level.INFO, "-------------------------------------------------------");

        // profiling
        logger.log(Level.INFO, SimpleProfiler.getResults());

        // learning statistics
        logger.log(Level.INFO, experiment.getRounds().getSummary());

        // model statistics
        logger.log(Level.INFO, "States: " + result.size());
        System.out.println(result.getStates());
        logger.log(Level.INFO, "Sigma: " + inputs.size());

        logger.info("Time Used in milliseconds: " + ((new Date()).getTime() - start.getTime()));
        // show model

        logger.log(Level.INFO, "Model: ");
        GraphDOT.write(result, inputs, System.out); // may throw IOException!
        String filename = "learn.dot";
        if (eqTestMethod == RANDOMWORDS)
            filename = eqTestMethod + "-" + MIN_LEN + "-" + MAX_LEN + "-" + MAX_TESTS + ".dot";
        else if (eqTestMethod == WMETHOD) {
            filename = eqTestMethod + "-" + LOOK_AHEAD + ".dot";
        } else if (eqTestMethod == WpMETHOD) {
            filename = eqTestMethod + "-" + LOOK_AHEAD + ".dot";
        }
        OutputStream outputStream = new FileOutputStream(filename);
        OutputStreamWriter outputStreamWriter = new OutputStreamWriter(outputStream);
        GraphDOT.write(result, inputs, outputStreamWriter); // may throw IOException!

        // Visualization.visualize(result, inputs);

        logger.log(Level.INFO, "-------------------------------------------------------");

        logger.log(Level.INFO, "Final observation table:");
        new ObservationTableASCIIWriter<>().write(lstar.getObservationTable(), System.out);

        // OTUtils.displayHTMLInBrowser(lstar.getObservationTable());
        return result;
    }

    public void refineUseMealyMachine(DFA<?, String> dfa, String eqTestMethod) throws IOException {
        start = new Date();
        FullMealyMembershipQueryOracle mealyOracle = new FullMealyMembershipQueryOracle().addDFAHelper(dfa);
        Supplier<MembershipOracle.MealyMembershipOracle<String, String>> supplier = () -> mealyOracle;
        DynamicParallelOracleBuilder<String, Word<String>> builder = new DynamicParallelOracleBuilder(supplier);

        MembershipOracle<String, Word<String>> mqOracle = builder.withPoolSize(32).create();
        ExtensibleLStarMealy<String, String> lstar = new ExtensibleLStarMealyBuilder<String, String>()
                .withAlphabet(inputs) // input alphabet
                .withOracle(mqOracle) // membership oracle
                .create();
        Experiment.MealyExperiment<String, String> experiment = null;
        switch (eqTestMethod) {
            case WMETHOD: {
                logger.info("this is " + WMETHOD);
                experiment = new Experiment.MealyExperiment<>(lstar, new WMethodEQOracle<>(mqOracle, LOOK_AHEAD),
                        inputs);
                break;
            }
            case WpMETHOD: {
                logger.info("this is " + WpMETHOD);
                experiment = new Experiment.MealyExperiment<>(lstar, new WpMethodEQOracle<>(mqOracle, LOOK_AHEAD),
                        inputs);
                break;
            }
            case RANDOMWMETHOD: {
                logger.info("this is " + RANDOMWMETHOD);
                experiment = new Experiment.MealyExperiment<>(lstar,
                        new RandomWMethodEQOracle<>(mqOracle, MINI_SZ, RANDOM_LEN, BOUND), inputs);
                break;
            }
            case RANDOMWpMETHOD: {
                logger.info("this is " + RANDOMWpMETHOD);
                experiment = new Experiment.MealyExperiment<>(lstar,
                        new RandomWpMethodEQOracle<>(mqOracle, MINI_SZ, RANDOM_LEN, BOUND), inputs);
                break;
            }
            case RANDOMWORDS: {
                logger.info("this is " + RANDOMWORDS);
                experiment = new Experiment.MealyExperiment<>(lstar,
                        new RandomWordsEQOracle<>(mqOracle, MIN_LEN, MAX_LEN, MAX_TESTS), inputs);
                break;
            }
            default: {
                experiment = new Experiment.MealyExperiment<>(lstar, new WMethodEQOracle<>(mqOracle, LOOK_AHEAD),
                        inputs);
            }
        }
        // turn on time profiling
        experiment.setProfile(true);

        // enable logging of models
        experiment.setLogModels(true);

        // run experiment
        experiment.run();

        // get learned model
        MealyMachine<?, String, ?, String> result = experiment.getFinalHypothesis();

        // report results
        logger.log(Level.INFO, "-------------------------------------------------------");

        // profiling
        logger.log(Level.INFO, SimpleProfiler.getResults());

        // learning statistics
        logger.log(Level.INFO, experiment.getRounds().getSummary());

        // model statistics
        logger.log(Level.INFO, "States: " + result.size());
        System.out.println(result.getStates());
        logger.log(Level.INFO, "Sigma: " + inputs.size());

        logger.info("Time Used in milliseconds: " + ((new Date()).getTime() - start.getTime()));
        // show model

        logger.log(Level.INFO, "Model: ");
        GraphDOT.write(result, inputs, System.out); // may throw IOException!
        String filename = "learn-mealy.dot";
        if (eqTestMethod == RANDOMWORDS)
            filename = eqTestMethod + "-" + MIN_LEN + "-" + MAX_LEN + "-" + MAX_TESTS + "-mealy.dot";
        else if (eqTestMethod == WMETHOD) {
            filename = eqTestMethod + "-" + LOOK_AHEAD + "-mealy.dot";
        } else if (eqTestMethod == WpMETHOD) {
            filename = eqTestMethod + "-" + LOOK_AHEAD + "-mealy.dot";
        }
        OutputStream outputStream = new FileOutputStream(filename);
        OutputStreamWriter outputStreamWriter = new OutputStreamWriter(outputStream);
        GraphDOT.write(result, inputs, outputStreamWriter); // may throw IOException!

        // Visualization.visualize(result, inputs);

        logger.log(Level.INFO, "-------------------------------------------------------");

        logger.log(Level.INFO, "Final observation table:");
        new ObservationTableASCIIWriter<>().write(lstar.getObservationTable(), System.out);
        return;
    }

    public Boolean exec(Transaction s, String input) {
        return s.method_(input);
    }

    public static int TransactionCount = 0;
    public static int QueryCount = 0;

    public class Transaction {

        private StringBuilder seqBuilder = null;
        private String uniqueID = null;

        public Transaction() {
            seqBuilder = new StringBuilder();
            uniqueID = UUID.randomUUID().toString();
            this.reset();
        }

        public Boolean reset() {
            return this.method_(RESET);
        }

        public Boolean method_(String str) {
            if (DEBUG) {
                if (str == RESET) {
                    return false;
                } else {
                    synchronized (Transaction.class) {
                        TransactionCount++;
                    }
                    logger.info("TransactionCount: " + TransactionCount);
                    return false;
                }
            } else {
                try {
                    try {
                        if (str == RESET) {
                            client.greet(uniqueID, str);
                            return true;
                        } else {
                            Boolean pass = client.greet(uniqueID, str);
                            if (!pass) // try more times. Pass is zero when the function failed or the parameters not
                                       // correctly set.
                                pass = client.greet(uniqueID, str);
                            if (!pass) // try more times. Pass is zero when the function failed or the parameters not
                                       // correctly set.
                                pass = client.greet(uniqueID, str);
                            // synchronized (Transaction.class) {
                            TransactionCount++;
                            // }
                            logger.info("TransactionCount: " + TransactionCount);
                            return pass;
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                        return false;
                    } finally {
                        /** 将连接对象返回给连接池 */
                        // objectPool.returnObject(client);
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                    return false;
                }
            }
        }
    }

    private static int LENGTH_QUERY = 8;

    class FullDFAMembershipQueryOracle implements MembershipOracle.DFAMembershipOracle<String> {
        private int resets = 0;
        private int symbols = 0;

        @Override
        public void processQueries(Collection<? extends Query<String, Boolean>> queries) {

            for (Query<String, Boolean> query : queries) {
                if (!DEBUG) {
                    if (query.getInput().length() > LENGTH_QUERY) {
                        query.answer(false);
                    }
                }

                String queryStr = String.join("-->", query.getInput());
                if (queryStr.length() == 0) {
                    query.answer(true);
                    continue;
                }

                synchronized (LStarDFALearner.class) {
                    QueryCount++;
                }
                logger.info("QueryCount: " + QueryCount);

                resets++;
                symbols += query.getInput().size();
                StringBuilder seqBuilder = new StringBuilder();

                for (String input : query.getInput()) {
                    seqBuilder.append(input);
                }
                // logger.log(Level.INFO,seqBuilder.toString());
                if (reader.Accept(seqBuilder.toString())) {
                    query.answer(true);
                    logger.info("YES: query: " + queryStr);
                    continue;
                } else if (reader.Reject(seqBuilder.toString())) {
                    query.answer(false);
                    logger.info("NO: query: " + queryStr);
                    continue;
                }

                Boolean ret = client.greetQuery(UUID.randomUUID().toString(), queryStr);

                if (ret) {
                    logger.info("YES: query: " + queryStr);
                    reader.addPosExample(seqBuilder.toString());
                } else {
                    logger.info("NO: query: " + queryStr);
                    // negative example cannot be refuted by later cases, otherwise the observation
                    // table get stuck at error.
                    // so we add it to the history cache.
                    // even though there may overlook some cases.
                    reader.addNegExample(seqBuilder.toString());
                }
                query.answer(ret);
            }
        }
    }

    class FullMealyMembershipQueryOracle implements MembershipOracle.MealyMembershipOracle<String, String> {
        private int resets = 0;
        private int symbols = 0;
        private DFA<?, String> dfa;

        FullMealyMembershipQueryOracle addDFAHelper(DFA<?, String> dfa) {
            this.dfa = dfa;
            return this;
        }

        @Override
        public void processQueries(Collection<? extends Query<String, Word<String>>> queries) {
            List<String> falseValue = new ArrayList<>();
            falseValue.add("-1");
            for (Query<String, Word<String>> query : queries) {
                String queryStr = String.join("-->", query.getInput());
                if (!DEBUG) {
                    if (query.getInput().length() > LENGTH_QUERY) {
                        List<String> output = new ArrayList<>();
                        for (int i = 0; i < query.getSuffix().size(); i++) {
                            output.add("-1");
                        }
                        logger.info("QueryCount: " + QueryCount);
                        logger.info("Query: " + queryStr);
                        logger.info("Suffix Output: " + output);
                        query.answer(Word.fromList(output));
                        continue;
                    }
                }

                if (queryStr.length() == 0) {
                    List<String> output = new ArrayList<>();
                    for (int i = 0; i < query.getSuffix().size(); i++) {
                        output.add("-1");
                    }
                    logger.info("QueryCount: " + QueryCount);
                    logger.info("Query: " + queryStr);
                    logger.info("Suffix Output: " + output);
                    query.answer(Word.fromList(output));
                    continue;
                }
                synchronized (LStarDFALearner.class) {
                    QueryCount++;
                }

                if (reader.hasQuery(queryStr)) {
                    String ret = reader.getOutput(queryStr);
                    logger.info("QueryCount: " + QueryCount);
                    logger.info("Query: " + queryStr);
                    logger.info("State: " + ret);
                    logger.info("Suffix Output: "
                            + Word.fromSymbols(ret.split("-->")).suffix(query.getSuffix().size()).toString());
                    query.answer(Word.fromSymbols(ret.split("-->")).suffix(query.getSuffix().size()));
                    continue;
                }
                resets++;
                symbols += query.getInput().size();

                StringBuilder seqBuilder = new StringBuilder();

                for (String input : query.getInput()) {
                    seqBuilder.append(input);
                }
                // logger.log(Level.INFO,seqBuilder.toString());
                if (query.getSuffix().size() == 1 && reader.Reject(seqBuilder.toString())) {
                    List<String> output = new ArrayList<>();
                    for (int i = 0; i < query.getSuffix().size(); i++) {
                        output.add("-1");
                    }
                    logger.info("QueryCount: " + QueryCount);
                    logger.info("Query: " + queryStr);
                    logger.info("Suffix Output: " + output);
                    query.answer(Word.fromList(output));
                    continue;
                }

                String ret = client.greetQueryWithOutput(UUID.randomUUID().toString(), queryStr);
                reader.addQuery(queryStr, ret);
                logger.info("QueryCount: " + QueryCount);
                logger.info("Query: " + queryStr);
                logger.info("State: " + ret);
                logger.info("Suffix Output: "
                        + Word.fromSymbols(ret.split("-->")).suffix(query.getSuffix().size()).toString());
                if (ret.split("-->")[ret.split("-->").length - 1] == "-1") {
                    reader.addNegExample(seqBuilder.toString());
                }
                query.answer(Word.fromSymbols(ret.split("-->")).suffix(query.getSuffix().size()));
            }
        }
    }

    class IncreDFARandomWordsEQOracle<A extends Output<I, Boolean>, I> extends RandomWordsEQOracle<A, I, Boolean> {
        private MembershipOracle<I, Boolean> increDFAmembershipOracle;

        public IncreDFARandomWordsEQOracle(MembershipOracle<I, Boolean> mqOracle, int minLength, int maxLength,
                int maxTests) {
            this(mqOracle, minLength, maxLength, maxTests, new Random());
        }

        public IncreDFARandomWordsEQOracle(MembershipOracle<I, Boolean> mqOracle, int minLength, int maxLength,
                int maxTests, Random random) {
            super(mqOracle, minLength, maxLength, maxTests, random, 1);
            increDFAmembershipOracle = mqOracle;
        }

        @Override
        public DefaultQuery<I, Boolean> findCounterExample(A hypothesis, Collection<? extends I> inputs) {
            if (inputs.isEmpty()) {
                logger.warning("Passed empty set of inputs to equivalence oracle; no counterexample can be found!");
                return null;
            } else {
                Stream<Word<I>> testWordStream = this.generateTestWords(hypothesis, inputs);
                Stream<DefaultQuery<I, Boolean>> queryStream = testWordStream.map(DefaultQuery::new);
                Stream<DefaultQuery<I, Boolean>> answeredQueryStream = this.answerQueries(queryStream);
                Stream<DefaultQuery<I, Boolean>> ceStream = answeredQueryStream.filter((query) -> {
                    Boolean hypOutput = hypothesis.computeOutput(query.getInput());
                    if (Boolean.TRUE.equals(hypOutput)) // reachability cannot decrease with most testing
                    {
                        if (DEBUG)
                            return !Objects.equals(hypOutput, query.getOutput());
                        else
                            return false;
                    } else
                        return !Objects.equals(hypOutput, query.getOutput());
                });
                return (DefaultQuery) ceStream.findFirst().orElse((DefaultQuery<I, Boolean>) null);
            }
        }

        private Stream<DefaultQuery<I, Boolean>> answerQueries(Stream<DefaultQuery<I, Boolean>> stream) {
            MembershipOracle var10001;
            var10001 = this.increDFAmembershipOracle;
            var10001.getClass();
            return stream.peek(var10001::processQuery);
        }
    }

    class IncreDFAWMethodEQOracle<A extends UniversalDeterministicAutomaton<?, I, ?, ?, ?> & Output<I, Boolean>, I>
            extends WMethodEQOracle<A, I, Boolean> {
        private MembershipOracle<I, Boolean> increDFAmembershipOracle;

        public IncreDFAWMethodEQOracle(MembershipOracle<I, Boolean> sulOracle, int lookahead) {
            super(sulOracle, lookahead, 0);
            increDFAmembershipOracle = sulOracle;
        }

        @Override
        public DefaultQuery<I, Boolean> findCounterExample(A hypothesis, Collection<? extends I> inputs) {
            if (inputs.isEmpty()) {
                logger.warning("Passed empty set of inputs to equivalence oracle; no counterexample can be found!");
                return null;
            } else {
                Stream<Word<I>> testWordStream = this.generateTestWords(hypothesis, inputs);
                Stream<DefaultQuery<I, Boolean>> queryStream = testWordStream.map(DefaultQuery::new);
                Stream<DefaultQuery<I, Boolean>> answeredQueryStream = this.answerQueries(queryStream);
                Stream<DefaultQuery<I, Boolean>> ceStream = answeredQueryStream.filter((query) -> {
                    Boolean hypOutput = hypothesis.computeOutput(query.getInput());
                    if (Boolean.TRUE.equals(hypOutput)) // reachability cannot decrease with most testing
                    {
                        if (DEBUG)
                            return !Objects.equals(hypOutput, query.getOutput());
                        else
                            return false;
                    } else
                        return !Objects.equals(hypOutput, query.getOutput());
                });
                return (DefaultQuery) ceStream.findFirst().orElse((DefaultQuery<I, Boolean>) null);
            }
        }

        private Stream<DefaultQuery<I, Boolean>> answerQueries(Stream<DefaultQuery<I, Boolean>> stream) {
            MembershipOracle var10001;
            var10001 = this.increDFAmembershipOracle;
            var10001.getClass();
            return stream.peek(var10001::processQuery);
        }
    }

    class IncreDFAWpMethodEQOracle<A extends UniversalDeterministicAutomaton<?, I, ?, ?, ?> & Output<I, Boolean>, I>
            extends WpMethodEQOracle<A, I, Boolean> {
        private MembershipOracle<I, Boolean> increDFAmembershipOracle;

        public IncreDFAWpMethodEQOracle(MembershipOracle<I, Boolean> sulOracle, int lookahead) {
            super(sulOracle, lookahead, 0);
            increDFAmembershipOracle = sulOracle;
        }

        @Override
        public DefaultQuery<I, Boolean> findCounterExample(A hypothesis, Collection<? extends I> inputs) {
            if (inputs.isEmpty()) {
                logger.warning("Passed empty set of inputs to equivalence oracle; no counterexample can be found!");
                return null;
            } else {
                Stream<Word<I>> testWordStream = this.generateTestWords(hypothesis, inputs);

                Stream<DefaultQuery<I, Boolean>> queryStream = testWordStream.map(DefaultQuery::new);
                Stream<DefaultQuery<I, Boolean>> answeredQueryStream = this.answerQueries(queryStream);
                Stream<DefaultQuery<I, Boolean>> ceStream = answeredQueryStream.filter((query) -> {
                    Boolean hypOutput = hypothesis.computeOutput(query.getInput());
                    if (Boolean.TRUE.equals(hypOutput)) // reachability cannot decrease with most testing
                    {
                        if (DEBUG)
                            return !Objects.equals(hypOutput, query.getOutput());
                        else
                            return false;
                    } else
                        return !Objects.equals(hypOutput, query.getOutput());
                });
                return (DefaultQuery) ceStream.findFirst().orElse((DefaultQuery<I, Boolean>) null);
            }
        }

        private Stream<DefaultQuery<I, Boolean>> answerQueries(Stream<DefaultQuery<I, Boolean>> stream) {
            MembershipOracle var10001;
            var10001 = this.increDFAmembershipOracle;
            var10001.getClass();
            return stream.peek(var10001::processQuery);
        }
    }
}
