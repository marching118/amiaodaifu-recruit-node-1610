package main

import (
	"io/ioutil"
	"strconv"
	"sync"

	"fmt"

	"github.com/parnurzeal/gorequest"
)

type questionInfo struct {
	ID     string `json:"id"`
	RootID int    `json:"rootId"`
}

type treeNode struct {
	ID       int         `json:"id"`
	Children []*treeNode `json:"children"`
}

var c = 5
var concurrencyLimit chan bool

func init() {
	concurrencyLimit = make(chan bool, c)
	for i := 0; i < c; i++ {
		concurrencyLimit <- true
	}
}

func getNode(question questionInfo, node *treeNode, wg *sync.WaitGroup) {
	defer wg.Done()
	// fmt.Println("get node", node.ID)

	<-concurrencyLimit
	children := []int{}
	gorequest.New().Get("http://hr.amiaodaifu.com:50000/1610/questions/" + question.ID + "/get-children/" + strconv.Itoa(node.ID)).EndStruct(&children)
	concurrencyLimit <- true

	var wgIn sync.WaitGroup
	wgIn.Add(len(children))
	for _, id := range children {
		cNode := treeNode{ID: id, Children: []*treeNode{}}
		node.Children = append(node.Children, &cNode)
		go getNode(question, &cNode, &wgIn)
	}
	wgIn.Wait()
}

func doTest() {
	// get question
	var question questionInfo
	gorequest.New().Post("http://hr.amiaodaifu.com:50000/1610/new-question").
		Send(map[string]string{"mail": "mmm@mmm.com"}).
		EndStruct(&question)

	// get tree
	tree := treeNode{ID: question.RootID, Children: []*treeNode{}}
	var wg sync.WaitGroup
	wg.Add(1)
	go getNode(question, &tree, &wg)
	wg.Wait()

	// check answer
	var checkResult map[string]interface{}
	gorequest.New().Post("http://hr.amiaodaifu.com:50000/1610/questions/" + question.ID + "/check").
		Send(map[string]interface{}{"root": tree}).
		EndStruct(&checkResult)
	fmt.Println(checkResult)

	// submit
	if pass, ok := checkResult["pass"].(bool); ok && pass == true {
		fmt.Println("pass")

		sourceCode, _ := ioutil.ReadFile("main.go")
		var submitResult map[string]interface{}
		gorequest.New().Post("http://hr.amiaodaifu.com:50000/1610/questions/" + question.ID + "/submit").
			Send(map[string]interface{}{"name": "MQ", "forFun": true, "phone": "1100000000", "sourceCode": string(sourceCode)}).
			EndStruct(&submitResult)
		fmt.Println(submitResult)
	} else {
		fmt.Println("fail")
	}
}
