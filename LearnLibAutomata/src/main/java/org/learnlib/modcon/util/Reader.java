package org.learnlib.modcon.util;

import java.io.*;
import java.util.*;
import java.util.logging.Logger;

import net.automatalib.words.Alphabet;
import net.automatalib.words.Word;
import net.automatalib.words.impl.GrowingMapAlphabet;

public class Reader{
    private static final Logger logger = Logger.getLogger(Reader.class.getName());
    private BufferedReader br;
    public Character start='a', end='a';
    private Map<Character, String> methodsMap;
    private Map<String, String> fullnameMethodsMap;
    private List<String> methods;
    private Set<String> negExampleSet;
    private Set<String> posExampleSet;
    private Map<String, String> queryOutput;
    public Reader(String file_path){
        try {
            File file = new File(file_path);
            FileReader  fr = new FileReader(file);
            br = new BufferedReader(fr);
            methodsMap = new HashMap<Character, String>();
            methods = new ArrayList<>();
            negExampleSet = new HashSet<>();
            posExampleSet = new HashSet<>();
            fullnameMethodsMap = new HashMap<>();
            queryOutput = new HashMap<>();
        } catch (Exception e) {
            //TODO: handle exception
        }
        
    }
    public void addQuery(String query, String output){
        this.queryOutput.put(query,output);
    }
    public Boolean hasQuery(String query){
        return this.queryOutput.containsKey(query);
    }
    public String getOutput(String query){
        assert this.queryOutput.containsKey(query);
        return this.queryOutput.get(query);
    }
    public String getFullNameFunction(String method){
        assert fullnameMethodsMap.containsKey(method);
        return fullnameMethodsMap.get(method);
    }

    public String getMethod(Character c){
        assert methodsMap.containsKey(c)==true;
        return methodsMap.get(c);
    }
    public List<String> getMethods(){
        return methods;
    }
    public void addPosExample(String example){
        synchronized (this.posExampleSet) {
            this.posExampleSet.add(example);
        }
    }
    public void addNegExample(String example){
        synchronized (this.negExampleSet) {
            this.negExampleSet.add(example);
        }
    }
    public Boolean Accept(String seq){
        Boolean ret = false;
        synchronized (this.posExampleSet) {
            if (posExampleSet.contains(seq))
                ret = true;
            else {
                for (String posExample : posExampleSet) {
                    if (posExample.startsWith(seq)) {
                        ret = true;
                        break;
                    }
                }
            }
        }
        return  ret;
    }

    public  Boolean Reject(String seq){
        Boolean ret = false;
        synchronized (this.negExampleSet) {
            if (negExampleSet.contains(seq))
                ret = true;
            else {
                for (String negExample : negExampleSet) {
                    if (seq.startsWith(negExample)) {
                        ret = true;
                        break;
                    }
                }
            }
        }
        return  ret;
    }

    public Vector<List<Word<Character>> > readExamples(){
        Vector<List<Word<Character>> > exampleSets = new Vector<List<Word<Character>> >();
        List<Word<Character>> posExamples = new ArrayList<Word<Character>>();
        List<Word<Character>> negExamples = new ArrayList<Word<Character>>();
        String line;
        try {
            if((line=br.readLine()).equals("characters")){
                while(!(line=br.readLine()).equals("positive examples"))  {
                    String[] maps = line.split(" ");
                    assert maps.length == 2;

                    fullnameMethodsMap.put(maps[1].split("\\(")[0],maps[1]);

                    maps[1] = maps[1].split("\\(")[0];

                    methods.add(maps[1]);
                    methodsMap.put(maps[0].charAt(0), maps[1]); 
                    if (start.charValue() > maps[0].charAt(0)){
                        start = maps[0].charAt(0);
                    }
                    if (end.charValue() < maps[0].charAt(0)){
                        end = maps[0].charAt(0);
                    }
                }
            }
            System.out.println(line);
            if(line.equals("positive examples")){
                while(!(line=br.readLine()).equals("negative examples"))  {
                    posExamples.add(Word.fromCharSequence(line));
                    StringBuilder seq = new StringBuilder();
                    for (int i=0; i<line.length();i++){
                        assert  methodsMap.containsKey(line.charAt(i))==true;
                        seq.append(methodsMap.get(line.charAt(i)));
                    }
                    posExampleSet.add(seq.toString());
                }
            }  
            System.out.println(line);
            if(line.equals("negative examples")){
                while((line=br.readLine())!=null){
                    negExamples.add(Word.fromCharSequence(line));
                    StringBuilder seq = new StringBuilder();
                    for (int i=0; i<line.length();i++){
                        assert  methodsMap.containsKey(line.charAt(i))==true;
                        seq.append(methodsMap.get(line.charAt(i)));
                    }
                    negExampleSet.add(seq.toString());
                }
            }  
            System.out.println(line);
            // don't rely on negative example
            negExampleSet = new HashSet<>();
           
        } catch (Exception e) {
            //TODO: handle exception
            exampleSets.add(new ArrayList<Word<Character>>());
            exampleSets.add(new ArrayList<Word<Character>>());
            return exampleSets;
        }
        exampleSets.add(posExamples);
        exampleSets.add(negExamples);
        return exampleSets;
    }
    public static class DFAData{
        private List<Word<String>> traces;
        private Alphabet<String>  alphabet;
        public DFAData(List<Word<String>> traces, Alphabet<String> alphabet){
            this.traces = traces;
            this.alphabet = alphabet;
        }
        public List<Word<String>> getTraces(){
            return this.traces;
        }
        public Alphabet<String> getAlphabet(){
            return this.alphabet;
        }
//        public List<Word<String>> getPossibleNegativeTraces(){
//            List<Word<String>> ls = new ArrayList<>();
//            for (Word<String> trace: traces)
//                for(String c: this.alphabet){
//                    ls.add(Word.fromList(trace.asList()).append(c));
//                }
//            return ls;
//        }
    }
    public static DFAData readStringExamples(String file_path) throws FileNotFoundException {
        File file = new File(file_path);
        FileReader  fr = new FileReader(file);
        BufferedReader br = new BufferedReader(fr);
        Alphabet<String> inputs = new GrowingMapAlphabet<>();
        List<Word<String>> posExamples = new ArrayList<Word<String>>();
        String line;
        try {
            if((line=br.readLine()).equals("alphabet")){
                while(!(line=br.readLine()).equals("---------------------"))  {
                        inputs.add(line);
                }
            }
            System.out.println(line);
            if((line=br.readLine()).equals("positive examples")){
                while((line=br.readLine())!=null)  {
                    posExamples.add(Word.fromList(Arrays.asList(line.split(" "))));
                }
            }

        } catch (Exception e) {
            //TODO: handle exception
            logger.warning(file_path+" is not valid");
            System.exit(-1);
        }
        return new DFAData(posExamples, inputs);
    }
}