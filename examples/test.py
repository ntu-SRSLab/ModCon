
def split_keep(string, sep):
        print(string, sep)
        start = 0
        oldstart = 0
        while (end := string.find(sep, start) + 1) > 0:
            print(start, end)
            print(string[oldstart:end-1])
            oldstart = end-1
            start = end+len(sep)
        # yield string[start:]
        print(string[oldstart:])

string = "setInitialOwner enterBidForPunk enterBidForPunk withdrawBidForPunk offerPunkForSaleToAddress buyPunk offerPunkForSale punkNoLongerForSale offerPunkForSale buyPunk enterBidForPunk offerPunkForSale offerPunkForSale offerPunkForSale offerPunkForSale buyPunk enterBidForPunk withdrawBidForPunk enterBidForPunk withdrawBidForPunk enterBidForPunk withdrawBidForPunk"
split_keep(string, "offerPunkForSaleToAddress")
print("hello world")