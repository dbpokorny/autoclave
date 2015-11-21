var obj = {
    'hello' : 10,
    20 : 'world\n',
    "a" : [1,2,3],
    "bc" : [[],[]],
    "def" : { "g" : "hi" },
};
console.log(JSON.stringify(obj));
console.log(JSON.stringify(JSON.parse(JSON.stringify(obj))));
