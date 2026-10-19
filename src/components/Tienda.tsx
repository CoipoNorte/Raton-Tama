import { motion } from "framer-motion";
import { Check, Coins, Heart, Package, Pill, ShoppingBag, Sparkles, X } from "lucide-react";
import { COMIDAS } from "../game/comidas";
import { ECONOMIA } from "../game/economia";
import { OBJETOS } from "../game/objetos";
import type { Partida } from "../game/types";
import IconoComida from "./IconoComida";

export type SeccionTienda = "despensa" | "rincon";

interface Props {
  partida: Partida;
  seccion: SeccionTienda;
  alCambiarSeccion: (seccion: SeccionTienda) => void;
  alCerrar: () => void;
  alComprarComida: (id: string) => void;
  alComprarObjeto: (id: string) => void;
  alComprarMedicina: () => void;
}

export default function Tienda({ partida, seccion, alCambiarSeccion, alCerrar, alComprarComida, alComprarObjeto, alComprarMedicina }: Props) {
  return (
    <div className="screen-overlay modal-overlay">
      <motion.section className="modal-panel shop-panel" role="dialog" aria-modal="true" aria-labelledby="shop-title" data-focus-scope="tienda"
        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ type: "spring", damping: 23 }}>
        <div className="modal-heading-row">
          <div><span className="modal-kicker">UN DETALLE PARA SU HOGAR</span><h2 id="shop-title">La tiendita</h2></div>
          <div className="modal-heading-actions"><span className="coin-balance"><Coins size={16} />{partida.monedas}</span><button className="icon-button close-button" type="button" aria-label="Cerrar tienda" onClick={alCerrar} data-game-focus="true"><X size={19} /></button></div>
        </div>
        <div className="shop-tabs" role="tablist" aria-label="Secciones de la tienda">
          <button type="button" className={seccion === "despensa" ? "shop-tab selected" : "shop-tab"} role="tab" aria-selected={seccion === "despensa"} onClick={() => alCambiarSeccion("despensa")} data-initial-focus={seccion === "despensa" ? "true" : undefined} data-game-focus="true"><ShoppingBag size={16} /> Despensa</button>
          <button type="button" className={seccion === "rincon" ? "shop-tab selected" : "shop-tab"} role="tab" aria-selected={seccion === "rincon"} onClick={() => alCambiarSeccion("rincon")} data-initial-focus={seccion === "rincon" ? "true" : undefined} data-game-focus="true"><Package size={16} /> Habitación</button>
        </div>
        <div className="shop-list" data-gesto-scroll>
          {seccion === "despensa" ? (
            <>
              {COMIDAS.map((comida) => (
                <article className="shop-row" key={comida.id} data-testid={`shop-food-${comida.id}`}>
                  <span className="shop-item-art food-art"><IconoComida modelo={comida.modelo} size={24} /></span>
                  <span className="shop-item-copy"><strong>{comida.nombre}</strong><small>{comida.descripcion}</small><small className="shop-stock">En la despensa: {partida.comidas[comida.id] ?? 0}</small></span>
                  <button className="buy-button" type="button" disabled={partida.monedas < comida.precio} onClick={() => alComprarComida(comida.id)} data-game-focus="true"><Coins size={14} /> {comida.precio}</button>
                </article>
              ))}
              <article className="shop-row medicine-row" data-testid="shop-medicine">
                <span className="shop-item-art medicine-art"><Pill size={21} /></span>
                <span className="shop-item-copy"><strong>Medicina de miel</strong><small>Un remedio suave para los días pachuchos.</small><small className="shop-stock">En el botiquín: {partida.medicinas}</small></span>
                <button className="buy-button" type="button" disabled={partida.monedas < ECONOMIA.precioMedicina} onClick={alComprarMedicina} data-game-focus="true"><Coins size={14} /> {ECONOMIA.precioMedicina}</button>
              </article>
            </>
          ) : OBJETOS.map((objeto) => {
            const comprado = partida.objetos.includes(objeto.id);
            return (
              <article className="shop-row" key={objeto.id} data-testid={`shop-object-${objeto.id}`}>
                <span className="shop-item-art room-art" style={{ "--item-color": objeto.color } as React.CSSProperties}>{objeto.categoria === "juguete" ? <Heart size={21} /> : objeto.categoria === "decoracion" ? <Sparkles size={21} /> : <Package size={21} />}</span>
                <span className="shop-item-copy"><strong>{objeto.nombre}</strong><small>{objeto.descripcion}</small><small className="shop-stock">{objeto.categoria}</small></span>
                <button className={comprado ? "buy-button bought" : "buy-button"} type="button" disabled={comprado || partida.monedas < objeto.precio} onClick={() => alComprarObjeto(objeto.id)} data-game-focus="true">{comprado ? <><Check size={15} /> Tuyo</> : <><Coins size={14} /> {objeto.precio}</>}</button>
              </article>
            );
          })}
        </div>
        <div className="shop-footer"><Sparkles size={15} /><span>Los muebles nuevos aparecerán en su diorama.</span></div>
      </motion.section>
    </div>
  );
}