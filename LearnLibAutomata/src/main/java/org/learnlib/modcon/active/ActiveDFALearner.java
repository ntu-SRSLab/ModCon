package org.learnlib.modcon.active;
import net.automatalib.automata.fsa.DFA;

import java.io.IOException;

public interface ActiveDFALearner {
    public void setAlphabets();
    public DFA<?,?> learn(String eqTestMethod) throws IOException;
}
