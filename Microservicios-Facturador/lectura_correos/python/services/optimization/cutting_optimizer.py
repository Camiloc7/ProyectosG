import sys
import json
import math
import time
import random
import hashlib
import logging
import multiprocessing as mp
from itertools import combinations
from typing import List, Dict, Any, Tuple, Optional, Annotated
import numpy as np
from shapely.geometry import Polygon, MultiPolygon, Point, LineString, box
from shapely import affinity
from shapely.ops import unary_union
from shapely.prepared import prep
from shapely.wkb import dumps as wkb_dumps, loads as wkb_loads
from rtree import index
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, conint, confloat
from shapely.geometry import Polygon as ShapelyPolygon
from math import pi
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn.error")
app = FastAPI()
app.add_middleware(
  CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
class PieceInput(BaseModel):
    shape_coords: List[List[float]]
    quantity: Annotated[int, conint(ge=1)] 

class CuttingRequest(BaseModel):
    lamina_coords: List[List[float]]
    pieces_to_cut: List[PieceInput]
    buffer_size: Annotated[float, confloat(ge=0.0)] = 5.0 
    generations: Annotated[int, conint(ge=1)] = 10
    population_size: Annotated[int, conint(ge=1)] = 40
    
def coords_to_shapely_polygon(coords: List[List[float]]) -> ShapelyPolygon:
    if not coords or len(coords) < 3:
        raise ValueError("Coordenadas de polígono inválidas")
    return ShapelyPolygon(coords)

def geom_of(p):
    if isinstance(p, tuple) and len(p) >= 1:
        return p[0]
    return p

def tid_of(p):
    if isinstance(p, tuple) and len(p) >= 2:
        return p[1]
    return None

def serialize_placed_piece(p: Tuple[Any, str]) -> Dict[str, Any]:
    g = geom_of(p)
    tid = tid_of(p)
    if isinstance(g, Polygon):
        return {"type": "Polygon", "coords": list(g.exterior.coords), "template_id": tid}
    elif isinstance(g, MultiPolygon):
        return {"type": "MultiPolygon", "coords": [list(poly.exterior.coords) for poly in g.geoms], "template_id": tid}
    return {"type": "Unknown", "coords": [], "template_id": tid}

def is_approx_rectangle(geom: ShapelyPolygon, tolerance: float = 0.5) -> bool:
    coords = list(geom.exterior.coords)
    if len(coords) not in [4, 5]:
        return False
    if len(coords) == 5 and coords[0] == coords[-1]:
        vertices = coords[:-1]
    elif len(coords) == 4:
        vertices = coords
    else:
        return False
  
    for i in range(len(vertices)):
        p_prev = vertices[(i - 1) % len(vertices)]
        p_curr = vertices[i]
        p_next = vertices[(i + 1) % len(vertices)]

        v1_x, v1_y = p_curr[0] - p_prev[0], p_curr[1] - p_prev[1]
        v2_x, v2_y = p_next[0] - p_curr[0], p_next[1] - p_curr[1]

        dot_product = v1_x * v2_x + v1_y * v2_y
        magnitude_v1 = math.hypot(v1_x, v1_y)
        magnitude_v2 = math.hypot(v2_x, v2_y)

        if magnitude_v1 == 0 or magnitude_v2 == 0:
            continue 
        try:
            cos_angle = dot_product / (magnitude_v1 * magnitude_v2)
            angle_rad = math.acos(max(-1.0, min(1.0, cos_angle)))
        except ValueError:
            return False
        angle_deg = math.degrees(angle_rad)
        
        if abs(angle_deg - 90) > tolerance and abs(angle_deg - 270) > tolerance and abs(angle_deg) > tolerance:
            if abs(cos_angle) > math.sin(math.radians(tolerance)):
                return False
            
    return True

class PieceTemplate:
    def __init__(self, geom: ShapelyPolygon, tid: Optional[str] = None, precompute_angles: Optional[List[int]] = None):
        self.geom = geom
        self.area = geom.area
        self.tid = tid if tid is not None else hashlib.sha1(geom.wkb).hexdigest()[:8]
        self._rot_cache: Dict[int, ShapelyPolygon] = {}
        self._buffer_cache: Dict[Tuple[int, float], ShapelyPolygon] = {}
        self.angles = precompute_angles or list(range(0, 360, 45)) 
        
        if precompute_angles:
            for a in precompute_angles:
                a_norm = int(a) % 360
                r = affinity.rotate(self.geom, a, origin='center')
                self._rot_cache[a_norm] = r

    def rotated(self, angle: int) -> ShapelyPolygon:
        a = int(angle) % 360
        if a in self._rot_cache:
            return self._rot_cache[a]
        r = affinity.rotate(self.geom, a, origin='center')
        self._rot_cache[a] = r
        return r
    
    def get_possible_angles(self) -> List[int]:
        return self.angles
    
    def buffered(self, angle: int, buffer_size: float) -> ShapelyPolygon:
        key = (int(angle) % 360, round(buffer_size, 6))
        if key in self._buffer_cache:
            return self._buffer_cache[key]
        base = self.rotated(angle)
        b = base.buffer(buffer_size)
        self._buffer_cache[key] = b
        return b

class OccupancyIndex:
    def __init__(self):
        self.idx = index.Index()
        self.items: Dict[int, ShapelyPolygon] = {}
        self._next_id = 0
    def insert(self, buffered_geom: ShapelyPolygon):
        _id = self._next_id
        self._next_id += 1
        self.items[_id] = buffered_geom
        self.idx.insert(_id, buffered_geom.bounds)
        return _id
    def query_intersecting_ids(self, geom_bounds):
        return list(self.idx.intersection(geom_bounds))
    def get_geom(self, _id):
        return self.items[_id]

def free_space_polygon(lamina: ShapelyPolygon, placed_pieces, buffer_size: float):
    placed = [geom_of(p).buffer(buffer_size) for p in placed_pieces] if placed_pieces else []
    if not placed:
        return lamina
    placed_union_buffered = unary_union(placed)
    if placed_union_buffered.is_empty:
        return lamina
    return lamina.difference(placed_union_buffered)

def find_gaps_and_anchors(lamina: ShapelyPolygon, placed_pieces, buffer_size: float):
    anchor_points = set()
    lamina_coords = list(lamina.exterior.coords)
    for c in lamina_coords:
        anchor_points.add(c)
        
    for p in placed_pieces:
        g = geom_of(p)
        anchor_points.add((g.bounds[0], g.bounds[1])) 
        if isinstance(g, Polygon):
            for c in g.exterior.coords:
                anchor_points.add(c)

    free_space = free_space_polygon(lamina, placed_pieces, buffer_size)
    if not free_space.is_empty:
        free_geoms = free_space.geoms if free_space.geom_type == "MultiPolygon" else [free_space]
        largest_free_poly = max(free_geoms, key=lambda p: p.area, default=None)
        if largest_free_poly:
            minx, miny, _, _ = largest_free_poly.bounds
            anchor_points.add((minx, miny))
    sorted_anchors = sorted(list(anchor_points), key=lambda p: math.hypot(p[0], p[1]))
    return sorted_anchors
def _bounds_intersect(b1, b2, margin=1e-9):
    return not (b1[2] <= b2[0] + margin or b1[0] >= b2[2] - margin or b1[3] <= b2[1] + margin or b1[1] >= b2[3] - margin)
def check_valid_placement_fast(lamina: ShapelyPolygon, lamina_prepped, lamina_bounds, candidate_geom: ShapelyPolygon,
                               occupancy_index: OccupancyIndex, buffer_size: float):
    minx, miny, maxx, maxy = candidate_geom.bounds
    lminx, lminy, lmaxx, lmaxy = lamina_bounds
    
    if minx < lminx - 1e-9 or miny < lminy - 1e-9 or maxx > lmaxx + 1e-9 or maxy > lmaxy + 1e-9:
        return False
    
    if not lamina_prepped.contains(candidate_geom):
        if not lamina.boundary.intersects(candidate_geom): 
            return False
    candidate_ids = occupancy_index.query_intersecting_ids(candidate_geom.bounds)
    if not candidate_ids:
        return True
    
    for cid in candidate_ids:
        buffered = occupancy_index.get_geom(cid)
        if not _bounds_intersect(buffered.bounds, candidate_geom.bounds):
            continue
        if buffered.intersects(candidate_geom):
            return False
    return True

def snap_down_and_left(candidate: ShapelyPolygon, lamina: ShapelyPolygon, lamina_prepped, lamina_bounds, occupancy_index: OccupancyIndex, buffer_size: float):
    step = max(1.0, (lamina_bounds[3] - lamina_bounds[1]) * 0.05)
    moved = candidate
    for _ in range(100): 
        trial = affinity.translate(moved, xoff=0, yoff=-step)
        if not check_valid_placement_fast(lamina, lamina_prepped, lamina_bounds, trial, occupancy_index, buffer_size):
            if step < 0.01: 
                break
            step /= 2.0
            continue
        moved = trial
        
    step = max(1.0, (lamina_bounds[2] - lamina_bounds[0]) * 0.05)
    for _ in range(100):
        trial = affinity.translate(moved, xoff=-step, yoff=0)
        if not check_valid_placement_fast(lamina, lamina_prepped, lamina_bounds, trial, occupancy_index, buffer_size):
            if step < 0.01: 
                break
            step /= 2.0
            continue
        moved = trial
        
    return moved
def find_valid_placement_center_out(lamina: ShapelyPolygon, piece_template: PieceTemplate, placed_pieces, buffer_size: float,
                                     lamina_prepped=None, lamina_bounds=None, occupancy_index: OccupancyIndex=None):

    angles = piece_template.get_possible_angles() 
    
    if lamina_prepped is None:
        lamina_prepped = prep(lamina)
    if lamina_bounds is None:
        lamina_bounds = lamina.bounds
    if occupancy_index is None:
        occupancy_index = OccupancyIndex()
        for gp in placed_pieces:
            occupancy_index.insert(geom_of(gp).buffer(buffer_size))
    
    nodes = find_gaps_and_anchors(lamina, placed_pieces, buffer_size)
    
    for angle in angles:
        rotated_piece = piece_template.rotated(angle)
        for anchor_x, anchor_y in nodes:
            pb_minx, pb_miny, _, _ = rotated_piece.bounds
            
            translated_piece = affinity.translate(rotated_piece, xoff=anchor_x - pb_minx, yoff=anchor_y - pb_miny)
            if not check_valid_placement_fast(lamina, lamina_prepped, lamina_bounds, translated_piece, occupancy_index, buffer_size):
                continue
            candidate = snap_down_and_left(translated_piece, lamina, lamina_prepped, lamina_bounds, occupancy_index, buffer_size)
            if check_valid_placement_fast(lamina, lamina_prepped, lamina_bounds, candidate, occupancy_index, buffer_size):
                return (candidate, piece_template.tid)
                
    return None
def calculate_cohesion_reward(solution, buffer_size, total_area):
    cohesion_score = 0.0
    rtree_idx = index.Index()
    polygons_indices = []
    for i, p in enumerate(solution):
        g = geom_of(p)
        if g.geom_type in ['Polygon', 'MultiPolygon']:
            rtree_idx.insert(i, g.bounds)
            polygons_indices.append(i)
    
    for i in polygons_indices:
        p1 = solution[i]
        g1 = geom_of(p1)
        possible_neighbors_indices = list(rtree_idx.intersection(g1.bounds))
        for j in possible_neighbors_indices:
            if i >= j: continue
            p2 = solution[j]
            g2 = geom_of(p2)
            if not isinstance(g2, Polygon): continue
            distance = g1.distance(g2)

            if distance < buffer_size * 0.5: 
                cohesion_score += (buffer_size - distance) * 10 
            
            if g1.touches(g2):
                touching_line = g1.exterior.intersection(g2.exterior)
                length = 0.0
                if touching_line.geom_type == 'LineString':
                    length = touching_line.length
                elif touching_line.geom_type == 'MultiLineString':
                    for line in touching_line.geoms:
                        length += line.length
                cohesion_score += length * 10 
    if total_area <= 0:
        return 0.0
    return cohesion_score / math.sqrt(total_area)

def calculate_compactness_score(solution):
    if not solution:
        return 0.0
    geoms = [geom_of(p) for p in solution]
    union = unary_union(geoms)
    minx, miny, maxx, maxy = union.bounds
    used_area = sum(g.area for g in geoms)
    bbox_area = (maxx - minx) * (maxy - miny)
    if bbox_area == 0:
        return 0.0
    return used_area / bbox_area

def new_advanced_score(solution, lamina, buffer_size):
    if not solution:
        return -10000.0
    compactness_score = calculate_compactness_score(solution)
    cohesion_reward = calculate_cohesion_reward(solution, buffer_size, lamina.area)
    final_score = (compactness_score * 5000.0) + (cohesion_reward * 200.0)
    return final_score

def evaluate_fitness(solution, lamina, buffer_size, total_required):
    score = new_advanced_score(solution, lamina, buffer_size)
    piece_penalty = (total_required - len(solution)) * 1000 
    final_aptitude = score - piece_penalty
    return final_aptitude
def evaluate_fitness_wrapper(args):
    individual, lamina, buffer_size, total_required = args
    return evaluate_fitness(individual, lamina, buffer_size, total_required)
_WORKER_LAMINA = None
_WORKER_BUFFER = None
_WORKER_TOTAL_REQUIRED = 1

def _worker_init(lamina_wkb, buffer_size, total_required):
    global _WORKER_LAMINA, _WORKER_BUFFER, _WORKER_TOTAL_REQUIRED
    _WORKER_LAMINA = wkb_loads(lamina_wkb)
    _WORKER_BUFFER = buffer_size
    _WORKER_TOTAL_REQUIRED = total_required

def _worker_eval_individual_wkb(ind_serial):
    individual = [(wkb_loads(wkb), tid) for (wkb, tid) in ind_serial]
    return evaluate_fitness(individual, _WORKER_LAMINA, _WORKER_BUFFER, _WORKER_TOTAL_REQUIRED)

def evaluate_population_parallel(population, lamina, buffer_size, processes=None, total_required=1):
    if processes is None:
        processes = min(6, max(1, mp.cpu_count() - 1))
    lamina_wkb = wkb_dumps(lamina)
    serial_pop = []
    for ind in population:
        serial_ind = []
        for (geom, tid) in ind:
            serial_ind.append((wkb_dumps(geom), tid))
        serial_pop.append(serial_ind)
    with mp.Pool(processes=processes, initializer=_worker_init, initargs=(lamina_wkb, buffer_size, total_required)) as pool:
        results = pool.map(_worker_eval_individual_wkb, serial_pop)
    return results

def create_initial_population(lamina, all_templates, buffer_size, population_size=200):
    population = []
    ordered_templates = sorted(all_templates, key=lambda t: t.area, reverse=True)
    lamina_prepped = prep(lamina)
    lamina_bounds = lamina.bounds
    
    for _ in range(population_size):
        individual = []
        occupancy = OccupancyIndex()
        shuffled = ordered_templates.copy()
        random.shuffle(shuffled)
        
        for tmpl in shuffled:
            placed = find_valid_placement_center_out(lamina, tmpl, individual, buffer_size,
                                                     lamina_prepped=lamina_prepped, lamina_bounds=lamina_bounds, occupancy_index=occupancy)
            if placed:
                geom, tid = placed
                individual.append((geom, tid))
                occupancy.insert(geom.buffer(buffer_size))
        population.append(individual)
    return population

def select_parents(population, fitness_scores):
    min_score = min(fitness_scores)
    positive_scores = [f - min_score + 1e-6 for f in fitness_scores] 
    total_fitness = sum(positive_scores)
    if total_fitness == 0:
        return random.choice(population), random.choice(population)
    probabilities = [f / total_fitness for f in positive_scores]
    parent1 = random.choices(population, weights=probabilities, k=1)[0]
    parent2 = random.choices(population, weights=probabilities, k=1)[0]
    return parent1, parent2

def crossover(parent1, parent2, lamina, buffer_size, template_map: Dict[str, PieceTemplate]):
    if not parent1 or not parent2:
        return []
    split_point = random.randint(1, min(len(parent1), len(parent2)))
    child = []
    child.extend(parent1[:split_point]) 
    child_tids = set(tid_of(c) for c in child)
    
    pieces_from_parent2 = [p for p in parent2 if tid_of(p) not in child_tids]
    pieces_from_parent2.sort(key=lambda p: geom_of(p).area, reverse=True)
    
    occupancy = OccupancyIndex()
    lamina_prepped = prep(lamina)
    lamina_bounds = lamina.bounds
    
    for p in child:
        occupancy.insert(geom_of(p).buffer(buffer_size))
    
    for piece in pieces_from_parent2:
        base_geom = geom_of(piece)
        tid = tid_of(piece)
        tmpl = template_map.get(tid)
        if not tmpl:
            tmpl = PieceTemplate(base_geom, tid) 
            
        placed = find_valid_placement_center_out(lamina, tmpl, child, buffer_size,
                                                 lamina_prepped=lamina_prepped, lamina_bounds=lamina_bounds, occupancy_index=occupancy)
        if placed:
            geom, tid = placed
            child.append((geom, tid))
            occupancy.insert(geom.buffer(buffer_size))
    return child

def mutate(individual, lamina, buffer_size, all_templates, template_map: Dict[str, PieceTemplate], mutation_rate=0.2):
    if not individual:
        return []
    if random.random() >= mutation_rate:
        return individual.copy()
    
    new_individual = individual.copy()
    if random.random() < 0.5:
        num_to_rearrange = random.choice([1, 2])
        if len(new_individual) < num_to_rearrange:
            num_to_rearrange = len(new_individual)
            
        pieces_to_rearrange = random.sample(new_individual, num_to_rearrange)
        individual_remaining = [p for p in new_individual if p not in pieces_to_rearrange]
        templates_to_place = []
        for p in pieces_to_rearrange:
            tid = tid_of(p)
            templates_to_place.append(template_map[tid])
    else:
        placed_tids = set(tid_of(p) for p in new_individual)
        unplaced_templates = [t for t in all_templates if t.tid not in placed_tids]
        
        if unplaced_templates:
            piece_to_add = random.choice(unplaced_templates)
            templates_to_place = [piece_to_add]
            individual_remaining = new_individual.copy()
        else:
            return new_individual.copy()

    lamina_prepped = prep(lamina)
    lamina_bounds = lamina.bounds
    occupancy = OccupancyIndex()
    for p in individual_remaining:
        occupancy.insert(geom_of(p).buffer(buffer_size))
        random.shuffle(templates_to_place)
    for tmpl in templates_to_place:
        placed = find_valid_placement_center_out(lamina, tmpl, individual_remaining, buffer_size,
                                                 lamina_prepped=lamina_prepped, lamina_bounds=lamina_bounds, occupancy_index=occupancy)
        if placed:
            geom, tid = placed
            individual_remaining.append((geom, tid))
            occupancy.insert(geom.buffer(buffer_size))
            
    return individual_remaining

def genetic_algorithm_optimizer(lamina, pieces_data, buffer_size=5, population_size=400, generations=100,
                                 processes=None, early_stop_patience=20):
    
    all_templates: List[PieceTemplate] = []
    template_map: Dict[str, PieceTemplate] = {} 
    total_pieces_required = 0
    
    for piece_data in pieces_data:
        total_pieces_required += piece_data['quantity']
        
        piece_shape = piece_data['shape']
        
        if is_approx_rectangle(piece_shape):
            piece_angles = [0, 90, 180, 270] 
        else:
            piece_angles = list(range(0, 360, 45)) 
            
        base_tid_prefix = hashlib.sha1(piece_shape.wkb).hexdigest()[:6]
        
        for i in range(piece_data['quantity']):
            tid = f"{base_tid_prefix}-{i:02d}"
            tmpl = PieceTemplate(piece_shape, tid=tid, precompute_angles=piece_angles)
            all_templates.append(tmpl)
            template_map[tid] = tmpl
            
    if population_size < 40:
        population_size = 40
    if generations < 50:
        generations = 50
    
    start_time = time.time()
    
    population = create_initial_population(lamina, all_templates, buffer_size, population_size)
    fitness_scores = evaluate_population_parallel(population, lamina, buffer_size, processes=processes, total_required=total_pieces_required)
    best_idx = int(np.argmax(fitness_scores))
    best_solution = population[best_idx]
    best_score = fitness_scores[best_idx]
    
    logger.info(f"Generación 0: Población inicial ({population_size}) - Mejor aptitud = {best_score:.6f}")
    
    no_improve_counter = 0
    for gen in range(1, generations + 1):
        new_population = []
        
        elite_count = max(1, int(population_size * 0.1))
        elite_indices = np.argsort(fitness_scores)[-elite_count:]
        for i in elite_indices:
            new_population.append(population[i])
        
        while len(new_population) < population_size:
            parent1, parent2 = select_parents(population, fitness_scores)
            
            child = crossover(parent1, parent2, lamina, buffer_size, template_map)
            
            mutated_child = mutate(child, lamina, buffer_size, all_templates, template_map)
            
            if mutated_child:
                new_population.append(mutated_child)
            
            if len(new_population) >= population_size:
                break
        
        population = new_population
        
        fitness_scores = evaluate_population_parallel(population, lamina, buffer_size, processes=processes, total_required=total_pieces_required)
        
        current_best_idx = int(np.argmax(fitness_scores))
        current_best_score = fitness_scores[current_best_idx]
        current_best = population[current_best_idx]
        if current_best_score > best_score:
            best_score = current_best_score
            best_solution = current_best
            no_improve_counter = 0
        else:
            no_improve_counter += 1
        
        logger.info(f"Generación {gen}: Mejor aptitud gen = {current_best_score:.6f}, Mejor global = {best_score:.6f}, Piezas colocadas: {len(best_solution)}")
        
        if early_stop_patience and no_improve_counter >= early_stop_patience:
            logger.info(f"No hubo mejora en {early_stop_patience} generaciones. Early stopping en generación {gen}.")
            break
        
    end_time = time.time()
    final_unplaced_count = total_pieces_required - len(best_solution)
    
    return {
        "lamina": lamina,
        "placed": best_solution,
        "unplaced_count": final_unplaced_count,
        "runtime": end_time - start_time
    }
@app.post("/optimize_cut")
def optimize_cutting_plan(request: CuttingRequest):
    try:
        lamina_shape = coords_to_shapely_polygon(request.lamina_coords)
        if not lamina_shape.is_valid or lamina_shape.area <= 0:
            raise HTTPException(status_code=400, detail="Lámina inválida")
        
        pieces_data = []
        total_qty = 0
        for p in request.pieces_to_cut:
            shape = coords_to_shapely_polygon(p.shape_coords)
            if not shape.is_valid or shape.area <= 0:
                raise HTTPException(status_code=400, detail="Una pieza tiene coordenadas inválidas")
            pieces_data.append({
                "shape": shape,
                "quantity": p.quantity
            })
            total_qty += p.quantity
        
        if total_qty == 0:
            raise HTTPException(status_code=400, detail="No hay piezas para cortar")
        
        logger.info("-" * 50)
        logger.info(f"Iniciando optimización para {total_qty} piezas solicitadas de {len(pieces_data)} tipos...")
        
        results = genetic_algorithm_optimizer(
            lamina_shape,
            pieces_data,
            buffer_size=request.buffer_size,
            population_size=request.population_size,
            generations=request.generations
        )
        
        logger.info("-" * 50)
        final_aptitude = evaluate_fitness(results['placed'], results['lamina'], request.buffer_size, total_qty)
        logger.info(f"Resultado final - Mejor Aptitud: {final_aptitude:.6f}")
        
        json_results = {
            "lamina": list(results["lamina"].exterior.coords),
            "placed": [serialize_placed_piece(p) for p in results['placed']],
            "unplaced_count": results['unplaced_count'],
            "runtime": results['runtime']
        }
        return json_results
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        logger.exception("Error interno del servidor durante la optimización.")
        raise HTTPException(status_code=500, detail=str(e))