import { Context, Material } from 'https://cdn.jsdelivr.net/gh/benc-uk/gsots3d@main/dist-single/gsots3d.min.js'

const gsots = await Context.init('canvas')
const s = gsots.createSphereInstance(Material.createBasicTexture('map2.png'), 11.0, 32, 32)

gsots.update = () => {
  s.rotateY(0.01)
  s.rotateX(0.006)
}

gsots.start()
