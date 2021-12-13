package org.learnlib.modcon.modelchecker;

import net.automatalib.automata.fsa.DFA;
import net.automatalib.serialization.dot.GraphDOT;
import net.automatalib.words.Alphabet;
import net.automatalib.words.Word;

import java.io.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.stream.Stream;

import org.apache.commons.exec.*;

public class ModelChecker {
    private int count;
    public  ModelChecker(){
        count = 0;
    }

    public void execModelCheck(String file) throws IOException, InterruptedException {
        CommandLine cmdLine = new CommandLine("python3");
        cmdLine.addArgument("dot2smv.py");
        cmdLine.addArgument("-x");
        cmdLine.addArgument("--input");
        cmdLine.addArgument("${file}");
        HashMap map = new HashMap();
        map.put("file", file);
        cmdLine.setSubstitutionMap(map);

        DefaultExecuteResultHandler resultHandler = new DefaultExecuteResultHandler();

        ExecuteWatchdog watchdog = new ExecuteWatchdog(60*1000);
        Executor executor = new DefaultExecutor();
        executor.setExitValue(1);
        executor.setWatchdog(watchdog);

        ByteArrayOutputStream data = new ByteArrayOutputStream();
//        executor.setStreamHandler(new PumpStreamHandler(System.out));
        executor.setStreamHandler(new PumpStreamHandler(data));
        executor.execute(cmdLine, resultHandler);
        resultHandler.waitFor();
        System.out.println(data.toString());
    }
    public <I> Stream<Word<I>> findCounterExample(DFA<?, I> M0, Alphabet<I> inputs) throws IOException, InterruptedException {
        // generate dot file
        String file = "/home/liuye/Projects/MachineLearning/learnlib-demo/checker/m"+count+".dot";
        OutputStream outputStream = new FileOutputStream(file);
        OutputStreamWriter outputStreamWriter = new OutputStreamWriter(outputStream);
        GraphDOT.write(M0, inputs, outputStreamWriter); // may throw IOException!

        // refine the dot file
        String cmd = "python3 refine.py ";
        Runtime run = Runtime.getRuntime();
        Process pr = run.exec(cmd);
        pr.waitFor();

        // translate and check model using NuSMV
        file = "/home/liuye/Projects/MachineLearning/learnlib-demo/checker/m"+count+"-refine.dot";
        execModelCheck(file);

        count ++;

        // check counterexample
        String ces_file = file + ".smv.ce";
        File f = new File(ces_file);
        if (!f.exists()){
            return null;
        }
        BufferedReader br = new BufferedReader(new FileReader(ces_file));
        List<Word<I>> ces = new ArrayList<>();
        String line = "";
        while((line=br.readLine())!=null){
            if (!line.equals("")) {
                System.out.println(line);
                I[] trace = (I[]) line.split("\\[")[1].split("]")[0].split(",");
                if (trace.length > 0)
                    ces.add(Word.fromSymbols(trace));
            }
        }

        if (ces.size()>0)
            return ces.stream();
        else
            return null;
    }
    public static void main(String[] args) throws InterruptedException, IOException {
//
        ModelChecker checker = new ModelChecker();

        String file = "/home/liuye/Projects/MachineLearning/learnlib-demo/checker/m1-refine.dot";
        checker.execModelCheck(file);
        // check counterexample
        String ces_file = file + ".smv.ce";
        File f = new File(ces_file);
        if (!f.exists()){
            return;
        }
        BufferedReader br = new BufferedReader(new FileReader(ces_file));
        List<Word<String>> ces = new ArrayList<>();
        String line = "";
        while((line=br.readLine())!=null){
            if (!line.equals("")) {
                System.out.println(line);
                String[] trace = (String[]) line.split("\\[")[1].split("]")[0].split(",");
                if (trace.length > 0)
                    ces.add(Word.fromSymbols(trace));
            }
        }
        System.out.println(ces);
    }
}
