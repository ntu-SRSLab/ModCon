package org.learnlib.modcon.util;

import com.google.common.collect.Lists;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class ABIPredicate {
    public static  List<String> insertValuePredicate(String function, int left, int right) {
        String method = function.split("\\(")[0];
        try {
            String[] parameters = function.split("\\(")[1].split("\\)")[0].split(",");
            List<String> names = ABIRenaming.rename(parameters);
            List<List<String>> groups = new ArrayList<>();
            for (int i = 0; i < parameters.length; i++) {
                if (isUint(parameters[i])) {
                    assert left>=0;
                    List<String> group = new ArrayList<>();
//                    group.add(left+"<"+names.get(i) + "<" + right);
//                    group.add(names.get(i) + "=" + left);
//                    group.add(0+"=<"+names.get(i) + "<" + left);
//                    group.add(names.get(i) + "=" + right);
//                    group.add(names.get(i) + ">" + right);
                    group.add(left+"=<"+names.get(i) + "<=" + right);
                    groups.add(group);
                    if(groups.size()>1)
                        break;
                }
                if (isInt(parameters[i])) {
                    List<String> group = new ArrayList<>();
//                    group.add(left+"<"+names.get(i) + "<" + right);
//                    group.add(names.get(i) + "=" + left);
////                    group.add(names.get(i) + "<" + left);
//                    group.add(0+"=<"+names.get(i) + "<" + left);
//                    group.add(names.get(i) + "=" + right);
//                    group.add(names.get(i) + ">" + right);
                    group.add(left+"=<"+names.get(i) + "<=" + right);
                    groups.add(group);
                }
            }

            List<String> methods = new ArrayList<>();
            methods.add(method);
            List<List<Object>> functionWithPredicate = Lists.cartesianProduct(methods, Lists.cartesianProduct(groups));
//        System.out.println(functionWithPredicate);

            List<String> alphabets = new ArrayList<>();
            for (List<?> item : functionWithPredicate) {
                alphabets.add(item.get(0) + " " + String.join(",", (List<String>) (item.get(1))));
            }
//        System.out.println(alphabets);
            return alphabets;
        }catch (Exception e){
            List<String> alphabets = new ArrayList<>();
            alphabets.add(method);
            return alphabets;
        }
    }
    public static  List<String> insertValuePredicate(String function, int pivot){
        String method = function.split("\\(")[0];
        try {
            String[] parameters = function.split("\\(")[1].split("\\)")[0].split(",");
            List<String> names = ABIRenaming.rename(parameters);
            List<List<String>> groups = new ArrayList<>();
            for (int i = 0; i < parameters.length; i++) {
                if (isUint(parameters[i])) {
//                System.out.println(names.get(i));
//                System.out.println(names.get(i)+">"+pivot);
//                System.out.println(names.get(i)+"="+pivot);
                    List<String> group = new ArrayList<>();
                    group.add(names.get(i) + ">" + pivot);
                    group.add(names.get(i) + "=" + pivot);
                    groups.add(group);
//                    if(groups.size()>1)
                        break;
                }
                if (isInt(parameters[i])) {
//                System.out.println(names.get(i));
//                System.out.println(names.get(i)+">"+pivot);
//                System.out.println(names.get(i)+"="+pivot);
//                System.out.println(names.get(i)+"<"+pivot);
                    List<String> group = new ArrayList<>();
                    group.add(names.get(i) + ">" + pivot);
                    group.add(names.get(i) + "=" + pivot);
                    group.add(names.get(i) + "<" + pivot);
                    groups.add(group);
//                    if(groups.size()>1)
                        break;
                }
            }

            List<String> methods = new ArrayList<>();
            methods.add(method);
            List<List<Object>> functionWithPredicate = Lists.cartesianProduct(methods, Lists.cartesianProduct(groups));
//        System.out.println(functionWithPredicate);

            List<String> alphabets = new ArrayList<>();
            for (List<?> item : functionWithPredicate) {
                alphabets.add(item.get(0) + " " + String.join(",", (List<String>) (item.get(1))));
            }
//        System.out.println(alphabets);
            return alphabets;
        }catch (Exception e){
            List<String> alphabets = new ArrayList<>();
            alphabets.add(method);
            return alphabets;
        }
    }
    public static Boolean isUint(String type){
        return type.startsWith("uint") && type.indexOf("[")==-1;
    }
    public static Boolean isInt(String type){
        return type.startsWith("int") && type.indexOf("[")==-1;
    }

    public static class ABIRenaming{
        public static final  char  A = 'a';
        public static List<String> rename(String[] parameters){
            List<String> renames = new ArrayList<>();
            for(int i=0; i<parameters.length; i++){
//                System.out.print( (char)(A+i)+" ");
                renames.add(""+(char)(A+i));
            }
//            System.out.println("");
            return  renames;
        }
    }
    public static void main(String[] args) throws NoSuchMethodException, IOException {
        String function = "bid(uint256,int256)";
        insertValuePredicate(function, 0);
    }
}
