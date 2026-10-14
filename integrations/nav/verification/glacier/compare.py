import re,json,hashlib,pathlib,subprocess
root=pathlib.Path(__file__).resolve().parent
def read(rev):
 text=(root/(rev+'.tap')).read_text()
 failures=[]
 for m in re.finditer(r'^not ok \d+ - ([^\n]+)\n  ---\n(.*?)^  \.\.\.$',text,re.M|re.S):
  name,block=m.groups()
  keys={}
  for key in ['failureType','exitCode','error','code','name','expected','actual','operator']:
   match=re.search(r'^  '+key+r': (.*?)(?=^  [a-zA-Z_]+:|\Z)',block,re.M|re.S)
   if match: keys[key]=match.group(1).rstrip()
  if name=='tests/dim-nav.test.cjs':
   preamble=text[:text.index('# Subtest:')]
   keys['moduleLoadAssertion']='\n'.join(line for line in preamble.splitlines() if ('AssertionError ' in line or line.startswith('#           ') or line.startswith('# 0 !==') or re.match(r"#   (code|actual|expected|operator):",line)))
  failures.append({'name':name,'signature':keys})
 totals={k:int(v) for k,v in re.findall(r'^# (tests|suites|pass|fail|cancelled|skipped|todo) (\d+)$',text,re.M)}
 return {'revision':rev,'sha':{'base':'08d2d0e7c70a7057dce5272abe2e44716fcb927c','candidate':'0b93fdfca36d70955efdd625c5b83e4f92dcf92d'}[rev],'exitCode':1,'totals':totals,'tapSha256':hashlib.sha256((root/(rev+'.tap')).read_bytes()).hexdigest(),'failures':failures}
b,c=read('base'),read('candidate')
report={'command':'node --test --test-reporter=tap tests/*.test.*','nodeVersion':subprocess.check_output(['node','--version'],text=True).strip(),'execution':'Independent pristine git archives, no source modifications','base':b,'candidate':c,'sameFailingNames':[f['name'] for f in b['failures']]==[f['name'] for f in c['failures']],'sameErrorSignatures':b['failures']==c['failures'],'addedPassingTests':c['totals']['pass']-b['totals']['pass'],'comparisonPolicy':'Compare exact failure names and error/code/expected/actual/operator/module-load assertion text; omit duration, absolute archive paths and stack frames.'}
(root/'comparison.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k not in ['base','candidate']},indent=2));print('base',b['totals']);print('candidate',c['totals'])
