from tslearn.generators import random_walks
from tslearn.clustering import KernelKMeans
X = random_walks(n_ts=50, sz=32, d=1)
print(X[0])
gak_km = KernelKMeans(n_clusters=3, kernel="gak", random_state=0)
km = gak_km.fit(X)
print(km.labels_)
# https://stackoverflow.com/questions/57424661/how-to-efficiently-remove-consecutive-duplicate-words-or-phrases-in-a-string
# input = "what type of people were were most likely to be able to be able to be able to be able to be 1.35 ?"
input = "createGame createGame userCancelActiveGame createGame createGame createGame ?"
def combine_words(input,length):
    combined_inputs = []
    if len(splitted_input)>1:
        for i in range(len(input)-1):
            combined_inputs.append(input[i]+" "+last_word_of(splitted_input[i+1],length)) #add the last word of the right-neighbour (overlapping) sequence (before it has expanded), which is the next word in the original sentence
    return combined_inputs, length+1

def remove_duplicates(input, length):
    bool_broke=False #this means we didn't find any duplicates here
    for i in range(len(input) - length):
        if input[i]==input[i + length]: #found a duplicate piece of sentence!
            for j in range(0,length): #remove the overlapping sequences in reverse order
                del input[i + length - j]
            bool_broke = True
            break #break the for loop as the loop length does not matches the length of splitted_input anymore as we removed elements
    if bool_broke:
        return remove_duplicates(input, length) #if we found a duplicate, look for another duplicate of the same length
    return input

def last_word_of(input,length):
    splitted = input.split(" ")
    if len(splitted)==0:
        return input
    else:
        return splitted[length-1]

#make a list of strings which represent every sequence of word_length adjacent words
splitted_input = input.split(" ")
word_length = 1
# splitted_input,word_length = combine_words(splitted_input,word_length)
# print(splitted_input)
# print(word_length)
intermediate_output = True

while len(splitted_input)>1:
    splitted_input = remove_duplicates(splitted_input,word_length) #look whether two sequences of length n (with distance n apart) are equal. If so, remove the n overlapping sequences
    print(splitted_input)
    splitted_input, word_length = combine_words(splitted_input,word_length) #make even bigger sequences
    if intermediate_output:
        print(splitted_input)
        print(word_length)
output = splitted_input[0] #In the end you have a list of length 1, with all possible lengths of repetitive words removed
print(output)