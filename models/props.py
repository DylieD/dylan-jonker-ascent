import sys
import os
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from lib import *
reset()
OR=0xff6a2b; TL=0x1f8a8a; TD=0x145a5e; BK=0x1a1a1e; WH=0xf4f1ea; GY=0x9aa0a6; DG=0x4a4d52; YL=0xffc83d; RD=0xe8112d
out=[]
def put(parts,name):
    o=join(parts,'x') if isinstance(parts,list) else parts
    o.name=name; select_only(o); bpy.ops.object.transform_apply(location=True); out.append(o); return o
def bn(n,size,loc,col,rot=(0,0,0),bevel=0.02,jitter=0.0): return box(n,size,loc=loc,rot=rot,col=col,bevel=bevel,native=True,jitter=jitter)
def dome(name,rx,ry,rz,col,seg=14,rings=10,loc=(0,0,0)):
    bm=bmesh.new(); bmesh.ops.create_uvsphere(bm,u_segments=seg,v_segments=rings,radius=1)
    for v in bm.verts: v.co=Vector((v.co.x*rx,v.co.y*ry,v.co.z*rz))
    bmesh.ops.delete(bm,geom=[v for v in bm.verts if v.co.z< -1e-4],context='VERTS')
    o=new_obj(name,mesh_from_bm(bm,name)); o.location=loc
    return finish(o,col,0,0,True)

# ---- tent
t=[dome('fly',1.7,1.25,1.05,OR,seg=16,rings=10),
   dome('fly2',1.74,0.7,0.9,0xe05520,seg=16,rings=10,loc=(0,-1.0,0)),
   bn('door',(0.7,0.04,0.8),(0,-1.53,0.4),0x241f1c,bevel=0.01),
   cyl('pole',0.03,0.03,2.6,loc=(0,0,0.9),rot=(0,math.pi/2,0),col=GY,seg=6)]
for s in (-1,1):
    t.append(tube('guy',[(s*1.2,-0.8,0.8),(s*2.4,-1.8,0.02)],0.015,0xe8e8e8,seg=4))
    t.append(cyl('peg',0.03,0.03,0.2,loc=(s*2.4,-1.8,0.08),col=GY,seg=5))
put(t,'tent')

# ---- jacaranda (Pretoria)
j=[tube('tr',[(0,0,0),(0.12,0,1.4),(-0.1,0.1,2.5)],0.2,0x4d3a2c,seg=8),
   tube('b1',[(-0.05,0.1,2.1),(-1.0,0.3,3.0)],0.1,0x4d3a2c,seg=6),
   tube('b2',[(0,0,2.0),(1.1,-0.2,2.9)],0.1,0x4d3a2c,seg=6),
   tube('b3',[(0,0.1,2.4),(0.1,0.5,3.4)],0.09,0x4d3a2c,seg=6)]
for (x,y,z,s,c) in [(0,0,3.6,1.7,0x9b6fd1),(-1.3,0.3,3.2,1.2,0xa27be0),(1.3,-0.2,3.1,1.25,0x8a5cc4),(0.2,0.6,4.2,1.1,0xb48be8),(-0.5,-0.7,3.3,0.9,0xad85e6),(0.8,0.5,3.0,0.9,0x9266cc)]:
    j.append(sphere('c',1.0,loc=(x,y,z),scale=(s,s*0.95,s*0.6),col=c,seg=10,rings=6,jitter=0.12))
put(j,'jacaranda')

# ---- laptop on a flat rock
a=math.radians(100)
lap=[bn('rock',(1.5,1.1,0.22),(0,0,0.11),0x8d7a68,bevel=0.07,jitter=0.1),
     bn('base',(0.95,0.64,0.05),(0,0,0.245),0xc6cbd2,bevel=0.02),
     bn('keys',(0.8,0.4,0.015),(0,-0.06,0.275),0x2b2e33,bevel=0.005)]
hinge=Vector((0,0.31,0.27)); d=Vector((0,0.17,0.98)).normalized()
c=hinge+d*0.31
lap.append(bn('lid',(0.95,0.03,0.62),tuple(c),0xc6cbd2,rot=(-0.17,0,0),bevel=0.015))
n=Vector((0,-0.98,0.17)); sc=c+n*0.02
lap.append(bn('scr',(0.86,0.01,0.54),tuple(sc),0x8fd8ff,rot=(-0.17,0,0),bevel=0.002))
for i in range(6):
    w=0.3+0.35*((i*37)%7)/7
    p=c+n*0.028+Vector((-0.38+w/2,0,0.2-i*0.065))
    lap.append(bn('ln',(w,0.004,0.025),tuple(p),[0x1b4a6b,0xff6a2b,0x1b4a6b,0x2a9d8f,0x1b4a6b,0xffc83d][i],rot=(-0.17,0,0),bevel=0.001))
put(lap,'laptop')

# ---- tatami + gi
m=[bn('mat',(3.2,2.4,0.12),(0,0,0.06),0x2c5f9e,bevel=0.03),
   bn('edge',(3.3,2.5,0.06),(0,0,0.03),0xcfd4da,bevel=0.02),
   cyl('ring',0.8,0.8,0.014,loc=(0,0,0.125),col=WH,seg=24),
   cyl('ringin',0.7,0.7,0.016,loc=(0,0,0.126),col=0x2c5f9e,seg=24)]
for i in range(3): m.append(bn('gi',(0.62,0.42,0.06),(1.0,0.4,0.15+i*0.06),WH,rot=(0,0,0.1),bevel=0.03))
m.append(bn('collar',(0.3,0.22,0.03),(1.0,0.2,0.34),0xe6e2da,rot=(0,0,0.1),bevel=0.01))
m.append(cyl('bottle',0.07,0.07,0.28,loc=(-1.1,0.6,0.26),col=0x2ec4b6,seg=8))
m.append(cyl('cap',0.05,0.05,0.05,loc=(-1.1,0.6,0.43),col=BK,seg=8))
put(m,'mat')

# ---- Gergeti Trinity Church on its mound
ch=[noise_rock('mound',3.6,3,0x6f6a62,flat=True,detail=2,squash=0.5,jit=0.12),
    bn('nave',(3.0,4.2,2.4),(0,0,1.55),0x9d978b,bevel=0.05,jitter=0.04),
    bn('roofL',(1.9,4.4,0.14),(-0.62,0,3.0),0x5a4c42,rot=(0,0.5,0),bevel=0.02),
    bn('roofR',(1.9,4.4,0.14),(0.62,0,3.0),0x5a4c42,rot=(0,-0.5,0),bevel=0.02),
    cyl('drum',0.82,0.82,1.2,loc=(0,0.3,3.6),col=0xa9a398,seg=12),
    cyl('dome',0.88,0.0,1.1,loc=(0,0.3,4.75),col=0x5a4c42,seg=12),
    cyl('cross',0.04,0.04,0.5,loc=(0,0.3,5.5),col=YL,seg=5),
    bn('crossb',(0.3,0.04,0.04),(0,0.3,5.5),YL,bevel=0.0),
    bn('door',(0.7,0.08,1.2),(0,-2.14,1.2),0x2a211c,bevel=0.01),
    cyl('arch',0.35,0.35,0.08,loc=(0,-2.14,1.8),rot=(math.pi/2,0,0),col=0x2a211c,seg=10),
    bn('tower',(1.2,1.2,3.9),(-2.0,-1.0,2.1),0x938d82,bevel=0.05,jitter=0.04),
    bn('twr_roof_base',(1.4,1.4,0.15),(-2.0,-1.0,4.1),0x5a4c42,bevel=0.02),
    cyl('twr_roof',0.95,0.0,1.4,loc=(-2.0,-1.0,4.9),col=0x5a4c42,seg=4,rot=(0,0,math.pi/4))]
for k in (-1,1): ch.append(bn('win',(0.2,0.05,0.5),(k*0.9,-2.14,1.9),0x2a211c,bevel=0.01))
put(ch,'church')

# ---- plane
p=[cyl('fus',0.24,0.24,3.4,rot=(math.pi/2,0,0),col=WH,seg=12),
   cyl('nose',0.24,0.02,0.7,loc=(0,-2.0,0),rot=(math.pi/2,0,0),col=WH,seg=12),
   cyl('tailcone',0.24,0.06,0.9,loc=(0,2.1,0.05),rot=(-math.pi/2,0,0),col=WH,seg=12),
   bn('wing',(3.8,0.8,0.06),(0,0.1,-0.08),0xdfe4ea,bevel=0.02),
   bn('wingtipL',(0.05,0.3,0.3),(-1.9,0.4,0.1),OR,rot=(0,0,0.15),bevel=0.01),
   bn('wingtipR',(0.05,0.3,0.3),(1.9,0.4,0.1),OR,rot=(0,0,-0.15),bevel=0.01),
   bn('fin',(0.06,0.7,0.9),(0,2.1,0.55),OR,rot=(0.3,0,0),bevel=0.015),
   bn('hstab',(1.4,0.35,0.05),(0,2.2,0.15),0xdfe4ea,bevel=0.01),
   bn('stripe',(0.5,3.0,0.02),(0,0,0.24),OR,bevel=0.005)]
for s in (-1,1):
    p.append(cyl('eng',0.14,0.14,0.55,loc=(s*0.8,-0.15,-0.28),rot=(math.pi/2,0,0),col=GY,seg=10))
for i in range(6): p.append(bn('wd',(0.03,0.07,0.07),(0.25,-1.2+i*0.18,0.16),0x1c2530,bevel=0.005))
put(p,'plane')

# ---- carabiner (white base, tinted in code)
pts=[(0,0,0),(0.17,0,0.05),(0.22,0,0.22),(0.16,0,0.43),(-0.04,0,0.46),(-0.16,0,0.4),(-0.17,0,0.12),(-0.12,0,0.02)]
cb=[tube('body',pts,0.032,0xffffff,seg=8,res=8,cyclic=True),
    bn('gate',(0.04,0.05,0.2),(-0.17,0,0.22),0xdadada,bevel=0.01),
    cyl('sleeve',0.05,0.05,0.07,loc=(-0.17,0,0.32),col=0xffffff,seg=8)]
put(cb,'carabiner')

# ---- Georgian flag
fl=[cyl('pole',0.04,0.04,4.2,loc=(0,0,2.1),col=GY,seg=6),sphere('tip',0.07,loc=(0,0,4.25),col=YL,seg=6,rings=4),
    bn('cloth',(1.8,0.03,1.2),(0.9,0,3.5),WH,bevel=0.005),
    bn('vc',(0.24,0.036,1.2),(0.9,0,3.5),RD,bevel=0.002),bn('hc',(1.8,0.036,0.24),(0.9,0,3.5),RD,bevel=0.002)]
for sx in (-1,1):
    for sz in (-1,1):
        cx=0.9+sx*0.45; cz=3.5+sz*0.3
        fl+= [bn('sv',(0.07,0.04,0.2),(cx,0,cz),RD,bevel=0.001),bn('sh',(0.2,0.04,0.07),(cx,0,cz),RD,bevel=0.001)]
put(fl,'flag')

# ---- rope coil
rc=[torus('r',0.34,0.045,loc=(0,0,0.05+i*0.08),col=0x1fa0a0 if i%3 else OR,seg=20,rseg=6) for i in range(5)]
rc.append(tube('tail',[(0.34,0,0.1),(0.7,-0.3,0.05),(1.1,-0.2,0.04)],0.045,0x1fa0a0,seg=6))
put(rc,'rope_coil')

# ---- backpack
bp=[bn('body',(0.62,0.38,0.8),(0,0,0.45),OR,bevel=0.09),bn('pocket',(0.48,0.14,0.4),(0,-0.25,0.3),TD,bevel=0.05),
    bn('lid',(0.58,0.4,0.16),(0,0,0.9),TD,bevel=0.05),cyl('mat',0.14,0.14,0.7,loc=(0,0,1.02),rot=(0,math.pi/2,0),col=0xffc83d,seg=10),
    bn('strap',(0.08,0.02,0.7),(-0.15,-0.2,0.5),BK,bevel=0.005),bn('strap2',(0.08,0.02,0.7),(0.15,-0.2,0.5),BK,bevel=0.005)]
put(bp,'backpack')

# ---- anchor (bolt + hanger + ring)
an=[bn('plate',(0.22,0.03,0.14),(0,-0.02,0),GY,bevel=0.01),cyl('bolt',0.025,0.025,0.1,loc=(0,-0.05,0),rot=(math.pi/2,0,0),col=0x6c7075,seg=6),
    torus('ring',0.09,0.014,loc=(0,-0.07,-0.1),rot=(math.pi/2,0,0),col=0xd8d8d8,seg=12,rseg=5)]
put(an,'anchor')

# ---- cairn
cr=[]
for i,(r,z,sx) in enumerate([(0.7,0.3,1.2),(0.5,0.78,1.1),(0.36,1.1,1.0),(0.26,1.35,1.0)]):
    cr.append(sphere('s',r,loc=(0.04*i,0.02*i,z),scale=(sx,1,0.62),col=[0x8d8a84,0x9c9890,0x7f7b75,0xa5a199][i],seg=10,rings=6,jitter=0.08))
put(cr,'cairn')

# ---- lantern
ln=[cyl('base',0.12,0.14,0.05,loc=(0,0,0.03),col=DG,seg=8),cyl('glass',0.1,0.1,0.26,loc=(0,0,0.18),col=0xffd27a,seg=8),
    cyl('top',0.08,0.13,0.06,loc=(0,0,0.34),col=DG,seg=8),torus('h',0.08,0.01,loc=(0,0,0.42),col=DG,seg=10,rseg=4)]
put(ln,'lantern')

# ---- boulders
for i,(r,sd,c) in enumerate([(1.0,2,0x9a7d62),(0.8,5,0x8a6f58),(1.2,9,0xa88a6c)]):
    put(noise_rock('x',r,sd,c,flat=True,detail=2,squash=0.7,jit=0.2),'boulder_'+'abc'[i])

# ---- ledge slab (origin back-edge centre, top at z=0, extends to -Y)
L=[bn('top',(8.0,3.2,0.5),(0,-1.6,-0.25),0xc79a6b,bevel=0.08,jitter=0.06),
   bn('mid',(7.2,2.7,0.6),(0.1,-1.3,-0.8),0xb48458,bevel=0.08,jitter=0.06),
   bn('low',(5.4,1.9,0.8),(-0.3,-0.9,-1.5),0xa07350,bevel=0.08,jitter=0.06),
   bn('lip',(2.6,0.5,0.22),(-2.4,-3.3,-0.1),0xd1a577,bevel=0.05,jitter=0.06),
   bn('lip2',(1.8,0.4,0.2),(2.8,-3.25,-0.12),0xd1a577,bevel=0.05,jitter=0.06)]
put(L,'ledge')

export(os.path.join(HERE, 'props_raw.glb'),out)
print('props ok',len(out))
